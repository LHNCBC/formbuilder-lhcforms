import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Paper,
  Typography,
  FormControl,
  FormControlLabel,
  FormLabel,
  RadioGroup,
  Radio,
  TextField,
  Checkbox,
  Select,
  MenuItem,
  InputLabel,
} from '@mui/material';
import { useForm } from '../../contexts/FormContext';
import { format } from 'date-fns';

interface FormPreviewProps {
  open: boolean;
  onClose: () => void;
}

interface FormResponse {
  [key: string]: any;
}

export function FormPreview({ open, onClose }: FormPreviewProps) {
  const { state } = useForm();
  const [responses, setResponses] = useState<FormResponse>({});

  useEffect(() => {
    // Reset responses when dialog opens
    if (open) {
      setResponses({});
    }
  }, [open]);

  const handleResponseChange = (linkId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [linkId]: value
    }));
  };

  const renderItem = (item: any) => {
    const value = responses[item.linkId];

    // Check if item should be enabled based on enableWhen conditions
    const isEnabled = evaluateEnableWhen(item);
    if (!isEnabled) {
      return null;
    }

    switch (item.type) {
      case 'group':
        return (
          <Box key={item.linkId} sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {item.text}
            </Typography>
            {item.item?.map((subItem: any) => renderItem(subItem))}
          </Box>
        );

      case 'choice':
        return (
          <FormControl key={item.linkId} fullWidth sx={{ mb: 2 }} required={item.required}>
            <FormLabel>{item.text}</FormLabel>
            <RadioGroup
              value={value || ''}
              onChange={(e) => handleResponseChange(item.linkId, e.target.value)}
            >
              {item.answerOption?.map((option: any, index: number) => (
                <FormControlLabel
                  key={index}
                  value={option.valueCoding?.code || option.valueString}
                  control={<Radio />}
                  label={option.valueCoding?.display || option.valueString}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      case 'boolean':
        return (
          <FormControl key={item.linkId} fullWidth sx={{ mb: 2 }} required={item.required}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={value || false}
                  onChange={(e) => handleResponseChange(item.linkId, e.target.checked)}
                />
              }
              label={item.text}
            />
          </FormControl>
        );

      case 'decimal':
      case 'integer':
        return (
          <FormControl key={item.linkId} fullWidth sx={{ mb: 2 }} required={item.required}>
            <TextField
              label={item.text}
              type="number"
              value={value || ''}
              onChange={(e) => handleResponseChange(item.linkId, e.target.value)}
              inputProps={{
                step: item.type === 'decimal' ? '0.01' : '1',
                min: item.minValue,
                max: item.maxValue
              }}
            />
          </FormControl>
        );

      case 'date':
        return (
          <FormControl key={item.linkId} fullWidth sx={{ mb: 2 }} required={item.required}>
            <TextField
              label={item.text}
              type="date"
              value={value || ''}
              onChange={(e) => handleResponseChange(item.linkId, e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </FormControl>
        );

      case 'dateTime':
        return (
          <FormControl key={item.linkId} fullWidth sx={{ mb: 2 }} required={item.required}>
            <TextField
              label={item.text}
              type="datetime-local"
              value={value || ''}
              onChange={(e) => handleResponseChange(item.linkId, e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </FormControl>
        );

      case 'text':
        return (
          <FormControl key={item.linkId} fullWidth sx={{ mb: 2 }} required={item.required}>
            <TextField
              label={item.text}
              multiline
              rows={4}
              value={value || ''}
              onChange={(e) => handleResponseChange(item.linkId, e.target.value)}
            />
          </FormControl>
        );

      default:
        return (
          <FormControl key={item.linkId} fullWidth sx={{ mb: 2 }} required={item.required}>
            <TextField
              label={item.text}
              value={value || ''}
              onChange={(e) => handleResponseChange(item.linkId, e.target.value)}
            />
          </FormControl>
        );
    }
  };

  const evaluateEnableWhen = (item: any): boolean => {
    if (!item.enableWhen?.length) {
      return true;
    }

    const results = item.enableWhen.map((condition: any) => {
      const dependentValue = responses[condition.question];
      
      switch (condition.operator) {
        case 'exists':
          return dependentValue !== undefined;
        case '=':
          return dependentValue === condition.answerString ||
                 dependentValue === condition.answerBoolean ||
                 dependentValue === condition.answerInteger?.toString() ||
                 dependentValue === condition.answerDecimal?.toString() ||
                 dependentValue === condition.answerCoding?.code;
        case '!=':
          return dependentValue !== condition.answerString &&
                 dependentValue !== condition.answerBoolean &&
                 dependentValue !== condition.answerInteger?.toString() &&
                 dependentValue !== condition.answerDecimal?.toString() &&
                 dependentValue !== condition.answerCoding?.code;
        default:
          return true;
      }
    });

    return item.enableBehavior === 'any' 
      ? results.some(r => r)
      : results.every(r => r);
  };

  const handleSubmit = () => {
    // Create QuestionnaireResponse resource
    const response = {
      resourceType: 'QuestionnaireResponse',
      questionnaire: state.formData.url,
      status: 'completed',
      authored: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
      item: Object.entries(responses).map(([linkId, answer]) => ({
        linkId,
        answer: [{ valueString: answer?.toString() }]
      }))
    };

    console.log('Form Response:', response);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {state.formData.title || 'Form Preview'}
      </DialogTitle>
      <DialogContent>
        <Paper sx={{ p: 3, mt: 2 }}>
          {state.formData.item?.map((item: any) => renderItem(item))}
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
}