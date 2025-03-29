import { v4 as uuidv4 } from 'uuid';

export function generateLinkId(): string {
  return uuidv4();
}

export function findItemById(items: any[], id: string): any | null {
  for (const item of items) {
    if (item.linkId === id) {
      return item;
    }
    if (item.item) {
      const found = findItemById(item.item, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

export function updateItemById(items: any[], id: string, updatedItem: any): any[] {
  return items.map(item => {
    if (item.linkId === id) {
      return { ...item, ...updatedItem };
    }
    if (item.item) {
      return {
        ...item,
        item: updateItemById(item.item, id, updatedItem)
      };
    }
    return item;
  });
}

export function deleteItemById(items: any[], id: string): any[] {
  return items.filter(item => {
    if (item.linkId === id) {
      return false;
    }
    if (item.item) {
      item.item = deleteItemById(item.item, id);
    }
    return true;
  });
}

export function addItemToParent(items: any[], parentId: string | null, newItem: any): any[] {
  if (!parentId) {
    return [...items, newItem];
  }

  return items.map(item => {
    if (item.linkId === parentId) {
      return {
        ...item,
        item: [...(item.item || []), newItem]
      };
    }
    if (item.item) {
      return {
        ...item,
        item: addItemToParent(item.item, parentId, newItem)
      };
    }
    return item;
  });
}

export function createNewItem(type: string = 'string'): any {
  return {
    linkId: generateLinkId(),
    text: 'New Item',
    type,
    required: false
  };
}