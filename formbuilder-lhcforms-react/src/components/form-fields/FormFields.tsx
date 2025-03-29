import { useEffect, useState } from 'react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Typography,
  Box,
  Divider,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { useForm } from '../../contexts/FormContext';
import { AnswerOptionsEditor } from './AnswerOptionsEditor';
import { EnableWhenEditor } from './EnableWhenEditor';
import { ValidationErrors } from '../validation/ValidationErrors';
import { validationService } from '../../services/ValidationService';
import { config } from '../../config/config';

function FormFields() {
  const { state, dispatch } = useForm();
  const [localItem, setLocalItem] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    setLocalItem(state.selectedItem);
    if (state.selectedItem) {
      const errors = validationService.validateQuestionnaireItem(state.selectedItem);
      setValidationErrors(errors);
    }
  }, [state.selectedItem]);

  const handleChange = (field: string, value: any) => {
    if (!localItem) return;

    const updatedItem = {
      ...localItem,
      [field]: value
    };
    setLocalItem(updatedItem);

    // Validate the updated item
    const errors = validationService.validateQuestionnaireItem(updatedItem);
    setValidationErrors(errors);

    // Update the form context
    dispatch({ 
      type: 'SET_SELECTED_ITEM',
      payload: updatedItem
    });
  };

  if (!localItem) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Select an item to edit its properties</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Item Properties
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      <ValidationErrors errors={validationErrors} />

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Link ID"
            value={localItem.linkId || ''}
            onChange={(e) => handleChange('linkId', e.target.value)}
            required
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Text"
            value={localItem.text || ''}
            onChange={(e) => handleChange('text', e.target.value)}
            required
          />
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth required>
            <InputLabel>Type</InputLabel>
            <Select
              value={localItem.type || ''}
              label="Type"
              onChange={(e) => handleChange('type', e.target.value)}
            >
              {Object.entries(config.itemTypes).map(([type, info]: [string, any]) => (
                <MenuItem key={type} value={type}>
                  {info.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={localItem.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={localItem.required || false}
                onChange={(e) => handleChange('required', e.target.checked)}
              />
            }
            label="Required"
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={localItem.repeats || false}
                onChange={(e) => handleChange('repeats', e.target.checked)}
              />
            }
            label="Repeats"
          />
        </Grid>

        {/* Type-specific fields */}
        {(localItem.type === 'choice' || localItem.type === 'open-choice') && (
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<FontAwesomeIcon icon={faChevronDown} />}>
                <Typography>Answer Options</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <AnswerOptionsEditor
                  options={localItem.answerOption || []}
                  onChange={(options) => handleChange('answerOption', options)}
                  type={localItem.type}
                />
              </AccordionDetails>
            </Accordion>
          </Grid>
        )}

        {/* Numeric constraints */}
        {(localItem.type === 'integer' || localItem.type === 'decimal') && (
          <Grid item xs={12} container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Minimum Value"
                value={localItem.minValue || ''}
                onChange={(e) => handleChange('minValue', e.target.value ? Number(e.target.value) : undefined)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Maximum Value"
                value={localItem.maxValue || ''}
                onChange={(e) => handleChange('maxValue', e.target.value ? Number(e.target.value) : undefined)}
              />
            </Grid>
          </Grid>
        )}

        {/* Enable When conditions */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<FontAwesomeIcon icon={faChevronDown} />}>
              <Typography>Enable When Conditions</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <EnableWhenEditor
                conditions={localItem.enableWhen || []}
                onChange={(conditions) => handleChange('enableWhen', conditions)}
              />
            </AccordionDetails>
          </Accordion>
        </Grid>

        {localItem.enableWhen?.length > 1 && (
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Enable Behavior</InputLabel>
              <Select
                value={localItem.enableBehavior || 'all'}
                label="Enable Behavior"
                onChange={(e) => handleChange('enableBehavior', e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="any">Any</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export default FormFields;