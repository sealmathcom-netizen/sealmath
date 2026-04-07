export default function Loading() {
  return (
    <div 
      className="page active" 
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}
    >
      <div 
        style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          color: 'var(--accent)',
          animation: 'pulse 1.5s infinite' 
        }}
      >
        Loading...
      </div>
    </div>
  )
}
