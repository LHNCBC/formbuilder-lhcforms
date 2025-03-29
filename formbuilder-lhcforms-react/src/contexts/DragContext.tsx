import { createContext, useContext, ReactNode } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const DragContext = createContext<null>(null);

export function DragProvider({ children }: { children: ReactNode }) {
  return (
    <DndProvider backend={HTML5Backend}>
      <DragContext.Provider value={null}>
        {children}
      </DragContext.Provider>
    </DndProvider>
  );
}

export function useDrag() {
  const context = useContext(DragContext);
  return context;
}