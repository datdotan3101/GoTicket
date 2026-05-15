import React from 'react'

export default function InlineError({ message, style = {} }) {
  if (!message) return null

  return (
    <span style={{ 
      color: '#ef4444', 
      fontSize: '0.75rem', 
      marginTop: '4px', 
      display: 'block', 
      fontWeight: 600,
      ...style
    }}>
      {message}
    </span>
  )
}

export const getInputErrorStyle = (hasError) => {
  return hasError ? { borderColor: '#ef4444' } : {}
}
