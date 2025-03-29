import { Box, Typography, Link } from '@mui/material';

function Footer() {
  return (
    <Box component="footer" sx={{ py: 2, textAlign: 'center', mt: 'auto' }}>
      <Typography variant="body2" color="text.secondary">
        {'© '}
        <Link color="inherit" href="https://lhncbc.nlm.nih.gov/">
          Lister Hill National Center for Biomedical Communications
        </Link>{' '}
        {new Date().getFullYear()}
      </Typography>
    </Box>
  );
}

export default Footer;