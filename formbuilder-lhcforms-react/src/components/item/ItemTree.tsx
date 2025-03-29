import { useState } from 'react';
import { TreeView, TreeItem } from '@mui/lab';
import { IconButton, Typography, Box } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronRight, 
  faChevronDown,
  faPlus,
  faTrash 
} from '@fortawesome/free-solid-svg-icons';
import { useForm } from '../../contexts/FormContext';

interface TreeNode {
  id: string;
  text: string;
  children?: TreeNode[];
}

function ItemTree() {
  const { state, dispatch } = useForm();
  const [expanded, setExpanded] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  const renderTree = (nodes: TreeNode) => (
    <TreeItem
      key={nodes.id}
      nodeId={nodes.id}
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', p: 0.5 }}>
          <Typography variant="body2" sx={{ flexGrow: 1 }}>
            {nodes.text}
          </Typography>
          <IconButton size="small" onClick={(e) => handleAddItem(e, nodes.id)}>
            <FontAwesomeIcon icon={faPlus} />
          </IconButton>
          <IconButton size="small" onClick={(e) => handleDeleteItem(e, nodes.id)}>
            <FontAwesomeIcon icon={faTrash} />
          </IconButton>
        </Box>
      }
    >
      {Array.isArray(nodes.children)
        ? nodes.children.map((node) => renderTree(node))
        : null}
    </TreeItem>
  );

  const handleAddItem = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    // TODO: Implement add item logic
  };

  const handleDeleteItem = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    // TODO: Implement delete item logic
  };

  const handleToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
    setExpanded(nodeIds);
  };

  const handleSelect = (event: React.SyntheticEvent, nodeIds: string[]) => {
    setSelected(nodeIds);
    // TODO: Update selected item in context
  };

  // Convert form data to tree structure
  const formToTree = (formData: any): TreeNode[] => {
    if (!formData?.item) return [];
    
    return formData.item.map((item: any, index: number) => ({
      id: `item-${index}`,
      text: item.text || `Item ${index + 1}`,
      children: item.item ? formToTree({ item: item.item }) : undefined
    }));
  };

  const treeData = formToTree(state.formData);

  return (
    <TreeView
      defaultCollapseIcon={<FontAwesomeIcon icon={faChevronDown} />}
      defaultExpandIcon={<FontAwesomeIcon icon={faChevronRight} />}
      expanded={expanded}
      selected={selected}
      onNodeToggle={handleToggle}
      onNodeSelect={handleSelect}
    >
      {treeData.map((node) => renderTree(node))}
    </TreeView>
  );
}

export default ItemTree;