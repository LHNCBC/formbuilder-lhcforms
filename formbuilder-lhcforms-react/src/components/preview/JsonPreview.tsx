import { useEffect, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { Box, Paper, Typography, Button } from '@mui/material';
import { useForm } from '../../contexts/FormContext';

interface JsonPreviewProps {
  onClose?: () => void;
  readOnly?: boolean;
}

export function JsonPreview({ onClose, readOnly = true }: JsonPreviewProps) {
  const { state, dispatch } = useForm();
  const [jsonValue, setJsonValue] = useState('');

  useEffect(() => {
    const formattedJson = JSON.stringify(state.formData, null, 2);
    setJsonValue(formattedJson);
  }, [state.formData]);

  const handleChange = (value: string) => {
    setJsonValue(value);
    if (!readOnly) {
      try {
        const parsed = JSON.parse(value);
        dispatch({ type: 'SET_FORM_DATA', payload: parsed });
      } catch (error) {
        // Handle JSON parse error if needed
      }
    }
  };

  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">FHIR Questionnaire JSON</Typography>
        {onClose && (
          <Button onClick={onClose} variant="outlined">
            Close
          </Button>
        )}
      </Box>
      
      <Box sx={{ flexGrow: 1, '& .cm-editor': { height: '100%' } }}>
        <CodeMirror
          value={jsonValue}
          height="100%"
          extensions={[json()]}
          theme={oneDark}
          onChange={handleChange}
          readOnly={readOnly}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
          }}
        />
      </Box>
    </Paper>
  );
}