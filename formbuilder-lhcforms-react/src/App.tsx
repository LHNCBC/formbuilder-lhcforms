import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, GlobalStyles } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { FormProvider } from './contexts/FormContext';
import { DragProvider } from './contexts/DragContext';
import BasePage from './components/base-page/BasePage';
import Header from './components/header/Header';
import Footer from './components/footer/Footer';
import { useEffect } from 'react';
import { validationService } from './services/ValidationService';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f5f5f5',
        },
      },
    },
  },
});

const globalStyles = {
  '.app': {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  'main': {
    flex: 1,
    padding: '24px',
    '@media (max-width: 600px)': {
      padding: '16px',
    },
  },
  '.cm-editor': {
    fontSize: '14px',
    height: '100%',
    '.cm-scroller': {
      fontFamily: 'monospace',
    },
  },
  '.drag-item': {
    cursor: 'move',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
    },
  },
  '.drag-over': {
    backgroundColor: 'rgba(25, 118, 210, 0.08)',
    borderColor: 'primary.main',
  },
};

function App() {
  useEffect(() => {
    // Load FHIR schema when app starts
    validationService.loadSchema().catch(console.error);
  }, []);

  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles styles={globalStyles} />
        <FormProvider>
          <DragProvider>
            <div className="app">
              <Header />
              <main>
                <Routes>
                  <Route path="/" element={<BasePage />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </DragProvider>
        </FormProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
