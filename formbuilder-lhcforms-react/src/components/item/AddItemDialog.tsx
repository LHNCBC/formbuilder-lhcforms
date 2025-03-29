import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
} from '@mui/material';
import { config } from '../../config/config';
import { createNewItem } from '../../utils/formUtils';

interface AddItemDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (item: any) => void;
}

export function AddItemDialog({ open, onClose, onAdd }: AddItemDialogProps) {
  const [itemType, setItemType] = useState('string');
  const [text, setText] = useState('');

  const handleAdd = () => {
    const newItem = createNewItem(itemType);
    newItem.text = text || 'New Item';
    onAdd(newItem);
    handleClose();
  };

  const handleClose = () => {
    setItemType('string');
    setText('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Item</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Item Type</InputLabel>
              <Select
                value={itemType}
                label="Item Type"
                onChange={(e) => setItemType(e.target.value)}
              >
                {Object.entries(config.itemTypes).map(([type, info]) => (
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
              label="Item Text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter item text"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleAdd} variant="contained" color="primary">
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}