export default function SealIcon({ size = 32, className = "" }: { size?: number, className?: string }) {
  return (
    <div 
      className={className}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        width: size,
        height: size,
        fontSize: `${size * 0.7}px`,
        lineHeight: 1,
        backgroundColor: 'rgba(123, 27, 56, 0.2)',
        borderRadius: '50%',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
      }}
    >
      🦭
    </div>
  )
}
