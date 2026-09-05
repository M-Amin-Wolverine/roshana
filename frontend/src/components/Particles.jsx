// components/Particles.jsx
import { useEffect, useRef, useState } from 'react'

const Particles = ({ 
  particleCount = 150,
  connectDistance = 120,
  mouseRadius = 150,
  speed = 0.5,
  color = '#00e0ff',
  opacity = 0.6
}) => {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: null, y: null })
  const animationRef = useRef(null)
  const particlesRef = useRef([])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // تنظیم اندازه Canvas
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // ردیابی موس
    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    const handleMouseLeave = () => {
      mouseRef.current = { x: null, y: null }
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    // کلاس ذره
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 2 + 0.5
        this.baseX = this.x
        this.baseY = this.y
        this.density = Math.random() * 30 + 1
        this.speedX = (Math.random() - 0.5) * speed
        this.speedY = (Math.random() - 0.5) * speed
        
        // رنگ‌های متنوع
        const colors = [
          color,
          '#22d3ee',
          '#67e8f9',
          '#ffffff'
        ]
        this.color = colors[Math.floor(Math.random() * colors.length)]
        this.alpha = Math.random() * 0.5 + 0.2
      }

      update() {
        // حرکت عادی
        this.x += this.speedX
        this.y += this.speedY

        // برگشت از لبه‌ها
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1

        // تعامل با موس
        if (mouseRef.current.x != null) {
          const dx = mouseRef.current.x - this.x
          const dy = mouseRef.current.y - this.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < mouseRadius) {
            const forceDirectionX = dx / distance
            const forceDirectionY = dy / distance
            const force = (mouseRadius - distance) / mouseRadius
            const directionX = forceDirectionX * force * this.density * 0.05
            const directionY = forceDirectionY * force * this.density * 0.05
            
            this.x -= directionX
            this.y -= directionY
          }
        }
      }

      draw() {
        ctx.fillStyle = this.color
        ctx.globalAlpha = this.alpha
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }
    }

    // ایجاد ذرات
    const initParticles = () => {
      particlesRef.current = []
      const count = window.innerWidth < 768 
        ? Math.floor(particleCount * 0.5) 
        : particleCount
      
      for (let i = 0; i < count; i++) {
        particlesRef.current.push(new Particle())
      }
    }
    initParticles()

    // انیمیشن
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // رسم ذرات
      particlesRef.current.forEach(particle => {
        particle.update()
        particle.draw()
      })

      // اتصال ذرات نزدیک (بهینه‌شده)
      const particles = particlesRef.current
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          // استفاده از فاصله مربعی برای بهینه‌سازی
          const distanceSq = dx * dx + dy * dy
          const maxDistSq = connectDistance * connectDistance
          
          if (distanceSq < maxDistSq) {
            const distance = Math.sqrt(distanceSq)
            const opacity = (connectDistance - distance) / connectDistance * 0.3
            
            ctx.strokeStyle = `${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      // اتصال به موس
      if (mouseRef.current.x != null) {
        particlesRef.current.forEach(particle => {
          const dx = mouseRef.current.x - particle.x
          const dy = mouseRef.current.y - particle.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < mouseRadius) {
            const opacity = (mouseRadius - distance) / mouseRadius * 0.5
            ctx.strokeStyle = `${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(mouseRef.current.x, mouseRef.current.y)
            ctx.stroke()
          }
        })
      }

      animationRef.current = requestAnimationFrame(animate)
    }
    animate()

    // پاکسازی
    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [particleCount, connectDistance, mouseRadius, speed, color])

  return (
    <canvas
      ref={canvasRef}
      style={particlesStyle}
    />
  )
}

const particlesStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  zIndex: 0,
  pointerEvents: 'none',
}

// نسخه ساده برای استفاده پیش‌فرض
export const SimpleParticles = () => (
  <Particles 
    particleCount={120}
    connectDistance={100}
    mouseRadius={120}
    speed={0.3}
    color="#00e0ff"
  />
)

// نسخه طلایی
export const GoldenParticles = () => (
  <Particles 
    particleCount={80}
    connectDistance={80}
    mouseRadius={100}
    speed={0.2}
    color="#fbbf24"
    opacity={0.5}
  />
)

// نسخه بنفش
export const PurpleParticles = () => (
  <Particles 
    particleCount={100}
    connectDistance={90}
    mouseRadius={110}
    speed={0.4}
    color="#a855f7"
  />
)

export default Particles