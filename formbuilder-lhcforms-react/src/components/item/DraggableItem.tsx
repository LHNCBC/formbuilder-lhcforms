import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Box, Typography, IconButton } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faGripVertical, 
  faTrash, 
  faEdit,
  faPlus 
} from '@fortawesome/free-solid-svg-icons';

interface DraggableItemProps {
  id: string;
  text: string;
  index: number;
  type: string;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAddChild: (id: string) => void;
  canHaveChildren?: boolean;
}

interface DragItem {
  id: string;
  index: number;
  type: string;
}

export function DraggableItem({
  id,
  text,
  index,
  type,
  moveItem,
  onEdit,
  onDelete,
  onAddChild,
  canHaveChildren = false
}: DraggableItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop({
    accept: 'item',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      moveItem(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'item',
    item: () => {
      return { id, index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0.4 : 1;
  drag(drop(ref));

  return (
    <Box
      ref={ref}
      sx={{
        opacity,
        p: 1,
        mb: 1,
        border: '1px solid #ccc',
        borderRadius: 1,
        bgcolor: 'background.paper',
        display: 'flex',
        alignItems: 'center',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
      data-handler-id={handlerId}
    >
      <IconButton size="small" sx={{ cursor: 'move', mr: 1 }}>
        <FontAwesomeIcon icon={faGripVertical} />
      </IconButton>
      
      <Typography variant="body2" sx={{ flexGrow: 1 }}>
        {text}
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 1 }}>
        {canHaveChildren && (
          <IconButton size="small" onClick={() => onAddChild(id)}>
            <FontAwesomeIcon icon={faPlus} />
          </IconButton>
        )}
        <IconButton size="small" onClick={() => onEdit(id)}>
          <FontAwesomeIcon icon={faEdit} />
        </IconButton>
        <IconButton size="small" onClick={() => onDelete(id)}>
          <FontAwesomeIcon icon={faTrash} />
        </IconButton>
      </Box>
    </Box>
  );
}