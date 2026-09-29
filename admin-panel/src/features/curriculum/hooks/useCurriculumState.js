import { useState } from 'react';

export function useCurriculumState() {
  const [activeTab, setActiveTab] = useState('classes');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('Class');
  const [editingItem, setEditingItem] = useState(null);
  const [initialParentId, setInitialParentId] = useState(null);

  // Deletion Modal State
  const [deleteState, setDeleteState] = useState({ isOpen: false, id: null, type: null, itemName: '' });

  const openModal = (type, item = null, parentId = null) => {
    setModalType(type);
    setEditingItem(item);
    setInitialParentId(parentId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleDeleteClick = (id, type, itemName = '') => {
    setDeleteState({ isOpen: true, id, type, itemName });
  };

  const closeDeleteModal = () => {
    setDeleteState({ isOpen: false, id: null, type: null, itemName: '' });
  };

  return {
    activeTab,
    setActiveTab,
    isModalOpen,
    modalType,
    editingItem,
    initialParentId,
    deleteState,
    openModal,
    closeModal,
    handleDeleteClick,
    closeDeleteModal
  };
}
