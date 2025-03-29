import { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Divider
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileExport, 
  faFileImport, 
  faPlus, 
  faSave,
  faEllipsisVertical,
  faEye
} from '@fortawesome/free-solid-svg-icons';
import { ExportImportDialog } from '../dialog/ExportImportDialog';
import { FormPreview } from '../preview/FormPreview';
import { useForm } from '../../contexts/FormContext';

function Header() {
  const { state, dispatch } = useForm();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  const hasFormData = state.formData && state.formData.item && state.formData.item.length > 0;

  const handleNewForm = () => {
    dispatch({
      type: 'SET_FORM_DATA',
      payload: {
        resourceType: 'Questionnaire',
        status: 'draft',
        item: []
      }
    });
    setMenuAnchorEl(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            LHC Forms Builder
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              color="inherit" 
              startIcon={<FontAwesomeIcon icon={faFileImport} />}
              onClick={() => setImportDialogOpen(true)}
            >
              Import
            </Button>
            <Button 
              color="inherit" 
              startIcon={<FontAwesomeIcon icon={faFileExport} />}
              onClick={() => setExportDialogOpen(true)}
            >
              Export
            </Button>
            <IconButton 
              color="inherit"
              onClick={handleMenuOpen}
              size="small"
            >
              <FontAwesomeIcon icon={faEllipsisVertical} />
            </IconButton>
          </Box>

          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={handleNewForm}>
              <FontAwesomeIcon icon={faPlus} style={{ marginRight: '8px' }} />
              New Form
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleMenuClose}>
              <FontAwesomeIcon icon={faSave} style={{ marginRight: '8px' }} />
              Save as Template
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <ExportImportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        mode="export"
      />

      <ExportImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        mode="import"
      />
    </>
  );
}

export default Header;