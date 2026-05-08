import { useEffect, useRef, useState } from 'react'

type CounterProps = {
  to: number
  prefix?: string
  suffix?: string
}

export default function Counter({ to, prefix = '', suffix = '' }: CounterProps) {
  const [count, setCount] = useState(0)
  const spanRef = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !started.current) {
          started.current = true
          const durationMs = 1600
          const start = performance.now()

          const tick = (now: number) => {
            const t = Math.min((now - start) / durationMs, 1)
            const ease = 1 - Math.pow(1 - t, 3)
            setCount(Math.round(ease * to))
            if (t < 1) requestAnimationFrame(tick)
          }

          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.3 },
    )

    if (spanRef.current) observer.observe(spanRef.current)
    return () => observer.disconnect()
  }, [to])

  return (
    <span ref={spanRef}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}
