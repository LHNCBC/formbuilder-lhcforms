import { useEffect } from 'react';
import { Box, Grid, Paper } from '@mui/material';
import { useForm } from '../../contexts/FormContext';
import FormFields from '../form-fields/FormFields';
import ItemTree from '../item/ItemTree';

function BasePage() {
  const { state, dispatch } = useForm();

  useEffect(() => {
    // Initialize with empty form structure
    dispatch({
      type: 'SET_FORM_DATA',
      payload: {
        type: 'Questionnaire',
        resourceType: 'Questionnaire',
        status: 'draft',
        item: []
      }
    });
  }, []);

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 'calc(100vh - 200px)', overflow: 'auto' }}>
            <ItemTree />
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 'calc(100vh - 200px)', overflow: 'auto' }}>
            <FormFields />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default BasePage;