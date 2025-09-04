import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ThemeProvider, createTheme, CssBaseline, responsiveFontSizes } from '@mui/material'

let baseTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#002379' },
    secondary: { main: '#D42E12' },
    background: {
      default: '#f8fafc',
      paper: '#ffffff'
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#4a5568'
    }
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'Inter, system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    h1: { fontFamily: 'Poppins, Inter, sans-serif', fontWeight: 800 },
    h2: { fontFamily: 'Poppins, Inter, sans-serif', fontWeight: 800 },
    h3: { fontFamily: 'Poppins, Inter, sans-serif', fontWeight: 800 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            'radial-gradient(1200px 600px at 10% -10%, rgba(0,35,121,0.08) 0%, rgba(0,0,0,0) 60%), radial-gradient(1200px 600px at 110% 10%, rgba(212,46,18,0.08) 0%, rgba(0,0,0,0) 60%), #f8fafc',
        },
        '::-webkit-scrollbar': { width: 8, height: 8 },
        '::-webkit-scrollbar-thumb': {
          backgroundColor: '#cbd5e1',
          borderRadius: 8,
        },
        '::-webkit-scrollbar-thumb:hover': { backgroundColor: '#94a3b8' },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { borderRadius: 16 } },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', borderRadius: 12, fontWeight: 600 },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 12 } },
    },
  },
})

baseTheme = responsiveFontSizes(baseTheme)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={baseTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
