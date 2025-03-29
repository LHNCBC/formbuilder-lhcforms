import { Alert, AlertTitle, Box, List, ListItem, ListItemText } from '@mui/material';

interface ValidationErrorsProps {
  errors: string[];
}

export function ValidationErrors({ errors }: ValidationErrorsProps) {
  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 2, mb: 3 }}>
      <Alert severity="error">
        <AlertTitle>Validation Errors</AlertTitle>
        <List dense>
          {errors.map((error, index) => (
            <ListItem key={index}>
              <ListItemText primary={error} />
            </ListItem>
          ))}
        </List>
      </Alert>
    </Box>
  );
}