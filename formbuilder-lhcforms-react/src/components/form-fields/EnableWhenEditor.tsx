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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEdit, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useForm } from '../../contexts/FormContext';
import { findItemById } from '../../utils/formUtils';

interface EnableWhenCondition {
  question: string;
  operator: string;
  answerBoolean?: boolean;
  answerDecimal?: number;
  answerInteger?: number;
  answerString?: string;
  answerCoding?: {
    code: string;
    system?: string;
    display?: string;
  };
}

interface EnableWhenEditorProps {
  conditions: EnableWhenCondition[];
  onChange: (conditions: EnableWhenCondition[]) => void;
}

const operators = [
  'exists',
  '=',
  '!=',
  '>',
  '<',
  '>=',
  '<=',
];

function EnableWhenDialog({
  open,
  onClose,
  onSave,
  initialCondition,
  availableQuestions,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (condition: EnableWhenCondition) => void;
  initialCondition?: EnableWhenCondition;
  availableQuestions: Array<{ linkId: string; text: string; type: string }>;
}) {
  const [question, setQuestion] = useState(initialCondition?.question || '');
  const [operator, setOperator] = useState(initialCondition?.operator || '=');
  const [answer, setAnswer] = useState<any>(
    initialCondition?.answerBoolean ??
    initialCondition?.answerDecimal ??
    initialCondition?.answerInteger ??
    initialCondition?.answerString ??
    initialCondition?.answerCoding?.code ??
    ''
  );

  const selectedQuestion = availableQuestions.find(q => q.linkId === question);

  const handleSave = () => {
    const condition: EnableWhenCondition = {
      question,
      operator,
    };

    if (selectedQuestion) {
      switch (selectedQuestion.type) {
        case 'boolean':
          condition.answerBoolean = answer === 'true';
          break;
        case 'decimal':
          condition.answerDecimal = parseFloat(answer);
          break;
        case 'integer':
          condition.answerInteger = parseInt(answer, 10);
          break;
        case 'choice':
          condition.answerCoding = { code: answer };
          break;
        default:
          condition.answerString = answer;
      }
    }

    onSave(condition);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {initialCondition ? 'Edit Condition' : 'Add Condition'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Question</InputLabel>
              <Select
                value={question}
                label="Question"
                onChange={(e) => setQuestion(e.target.value)}
              >
                {availableQuestions.map((q) => (
                  <MenuItem key={q.linkId} value={q.linkId}>
                    {q.text}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Operator</InputLabel>
              <Select
                value={operator}
                label="Operator"
                onChange={(e) => setOperator(e.target.value)}
              >
                {operators.map((op) => (
                  <MenuItem key={op} value={op}>
                    {op}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {operator !== 'exists' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                type={selectedQuestion?.type === 'decimal' || selectedQuestion?.type === 'integer' ? 'number' : 'text'}
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
          disabled={!question || !operator || (operator !== 'exists' && !answer)}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function EnableWhenEditor({ conditions, onChange }: EnableWhenEditorProps) {
  const { state } = useForm();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCondition, setEditingCondition] = useState<EnableWhenCondition | undefined>();
  const [editingIndex, setEditingIndex] = useState<number>(-1);

  // Get all available questions from the form
  const getAvailableQuestions = (items: any[], result: any[] = []): any[] => {
    items.forEach(item => {
      if (item.linkId && item.text) {
        result.push({
          linkId: item.linkId,
          text: item.text,
          type: item.type
        });
      }
      if (item.item) {
        getAvailableQuestions(item.item, result);
      }
    });
    return result;
  };

  const availableQuestions = getAvailableQuestions(state.formData?.item || []);

  const handleAdd = () => {
    setEditingCondition(undefined);
    setEditingIndex(-1);
    setDialogOpen(true);
  };

  const handleEdit = (condition: EnableWhenCondition, index: number) => {
    setEditingCondition(condition);
    setEditingIndex(index);
    setDialogOpen(true);
  };

  const handleDelete = (index: number) => {
    const newConditions = [...conditions];
    newConditions.splice(index, 1);
    onChange(newConditions);
  };

  const handleSave = (condition: EnableWhenCondition) => {
    const newConditions = [...conditions];
    if (editingIndex >= 0) {
      newConditions[editingIndex] = condition;
    } else {
      newConditions.push(condition);
    }
    onChange(newConditions);
    setDialogOpen(false);
  };

  const getConditionText = (condition: EnableWhenCondition): string => {
    const questionItem = availableQuestions.find(q => q.linkId === condition.question);
    const questionText = questionItem?.text || condition.question;
    
    if (condition.operator === 'exists') {
      return `${questionText} exists`;
    }

    const answer = condition.answerBoolean?.toString() ||
                  condition.answerDecimal?.toString() ||
                  condition.answerInteger?.toString() ||
                  condition.answerString ||
                  condition.answerCoding?.code ||
                  '';

    return `${questionText} ${condition.operator} ${answer}`;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1">Enable When Conditions</Typography>
        <Button
          startIcon={<FontAwesomeIcon icon={faPlus} />}
          onClick={handleAdd}
          variant="outlined"
          size="small"
        >
          Add Condition
        </Button>
      </Box>

      <List>
        {conditions.map((condition, index) => (
          <ListItem key={index} divider>
            <ListItemText primary={getConditionText(condition)} />
            <ListItemSecondaryAction>
              <IconButton edge="end" onClick={() => handleEdit(condition, index)} sx={{ mr: 1 }}>
                <FontAwesomeIcon icon={faEdit} />
              </IconButton>
              <IconButton edge="end" onClick={() => handleDelete(index)}>
                <FontAwesomeIcon icon={faTrash} />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <EnableWhenDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        initialCondition={editingCondition}
        availableQuestions={availableQuestions}
      />
    </Box>
  );
}