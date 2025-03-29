import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEdit, faPlus } from '@fortawesome/free-solid-svg-icons';

interface AnswerOption {
  valueCoding?: {
    code: string;
    display: string;
    system?: string;
  };
  valueString?: string;
}

interface AnswerOptionsEditorProps {
  options: AnswerOption[];
  onChange: (options: AnswerOption[]) => void;
  type: 'choice' | 'open-choice';
}

interface OptionDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (option: AnswerOption) => void;
  initialOption?: AnswerOption;
  type: 'choice' | 'open-choice';
}

function OptionDialog({ open, onClose, onSave, initialOption, type }: OptionDialogProps) {
  const [code, setCode] = useState(initialOption?.valueCoding?.code || '');
  const [display, setDisplay] = useState(initialOption?.valueCoding?.display || '');
  const [system, setSystem] = useState(initialOption?.valueCoding?.system || '');
  const [value, setValue] = useState(initialOption?.valueString || '');

  const handleSave = () => {
    const option: AnswerOption = type === 'choice' 
      ? {
          valueCoding: {
            code,
            display: display || code,
            ...(system && { system })
          }
        }
      : { valueString: value };
    
    onSave(option);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {initialOption ? 'Edit Answer Option' : 'Add Answer Option'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {type === 'choice' ? (
            <>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Display Text"
                  value={display}
                  onChange={(e) => setDisplay(e.target.value)}
                  helperText="If not provided, code will be used as display text"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="System"
                  value={system}
                  onChange={(e) => setSystem(e.target.value)}
                  helperText="Optional: URI of the code system"
                />
              </Grid>
            </>
          ) : (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave}
          variant="contained" 
          disabled={type === 'choice' ? !code : !value}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function AnswerOptionsEditor({ options, onChange, type }: AnswerOptionsEditorProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<AnswerOption | undefined>();
  const [editingIndex, setEditingIndex] = useState<number>(-1);

  const handleAdd = () => {
    setEditingOption(undefined);
    setEditingIndex(-1);
    setDialogOpen(true);
  };

  const handleEdit = (option: AnswerOption, index: number) => {
    setEditingOption(option);
    setEditingIndex(index);
    setDialogOpen(true);
  };

  const handleDelete = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    onChange(newOptions);
  };

  const handleSave = (option: AnswerOption) => {
    const newOptions = [...options];
    if (editingIndex >= 0) {
      newOptions[editingIndex] = option;
    } else {
      newOptions.push(option);
    }
    onChange(newOptions);
    setDialogOpen(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1">Answer Options</Typography>
        <Button
          startIcon={<FontAwesomeIcon icon={faPlus} />}
          onClick={handleAdd}
          variant="outlined"
          size="small"
        >
          Add Option
        </Button>
      </Box>

      <List>
        {options.map((option, index) => (
          <ListItem key={index} divider>
            <ListItemText
              primary={
                option.valueCoding
                  ? `${option.valueCoding.code} - ${option.valueCoding.display || option.valueCoding.code}`
                  : option.valueString
              }
              secondary={option.valueCoding?.system}
            />
            <ListItemSecondaryAction>
              <IconButton edge="end" onClick={() => handleEdit(option, index)} sx={{ mr: 1 }}>
                <FontAwesomeIcon icon={faEdit} />
              </IconButton>
              <IconButton edge="end" onClick={() => handleDelete(index)}>
                <FontAwesomeIcon icon={faTrash} />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <OptionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        initialOption={editingOption}
        type={type}
      />
    </Box>
  );
}