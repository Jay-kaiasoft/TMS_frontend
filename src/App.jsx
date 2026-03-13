import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import AppRoutes from './Routes';
import GlobalAlert from './components/common/globalAlert';
import Loader from './components/common/loader/loader';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalAlert />
      <Loader />
      <AppRoutes />
    </ThemeProvider>
  );
}

export default App;
