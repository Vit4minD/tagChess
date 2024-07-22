"use client"
import { useState, useEffect, useRef } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'

export default function Home() {
  const [game, setGame] = useState(new Chess())
  const [boardWidth, setBoardWidth] = useState(0) // Initial width set to 0 for SSR
  const stockfishWorkerRef = useRef(null)

  useEffect(() => {
    function handleResize() {
      setBoardWidth(window.innerWidth / 2)
    }

    window.addEventListener('resize', handleResize)
    handleResize() // Set initial size on mount

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    stockfishWorkerRef.current = new Worker(`/stockfish.js`)
    stockfishWorkerRef.current.onmessage = (event) => {
      const message = event.data
      if (message.startsWith('bestmove')) {
        const move = message.split(' ')[1]
        safeGameMutate((game) => {
          game.move({
            from: move.substring(0, 2),
            to: move.substring(2, 4),
            promotion: 'q'
          })
        })
      }
    }

    return () => {
      if (stockfishWorkerRef.current) {
        stockfishWorkerRef.current.terminate()
      }
    }
  }, [])

  useEffect(() => {
    if (stockfishWorkerRef.current) {
      stockfishWorkerRef.current.postMessage(`setoption name Skill Level value 1`)
    }
  }, [])

  useEffect(() => {
    if (game.turn() === 'b') {
      stockfishWorkerRef.current.postMessage(`position fen ${game.fen()}`)
      stockfishWorkerRef.current.postMessage('go depth 1')
    }
  }, [game])

  function safeGameMutate(modify) {
    setGame((g) => {
      const update = new Chess(g.fen())
      modify(update)
      return update
    })
  }

  function onDrop(source, target) {
    let move = null
    safeGameMutate((game) => {
      try {
        move = game.move({
          from: source,
          to: target,
          promotion: 'q' // Always promote to a queen for simplicity
        })
      } catch (Error) {
        console.log(Error)
      }
    })
    if (move == null) return false

    return true
  }

  return (
    <main className=''>
      {boardWidth > 0 && (
        <Chessboard
          position={game.fen()}
          onPieceDrop={onDrop}
          boardWidth={boardWidth} // Adjust the width as needed
          orientation="black" // Set board orientation to black
        />
      )}
    </main>
  )
}
