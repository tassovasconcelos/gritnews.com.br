import React, { useState } from 'react';
import { Plus, Edit2, Trash2, FolderPlus } from 'lucide-react';
import { Category } from '../../types';
import { saveCategory, deleteCategory } from '../../lib/storage';
import { Modal } from '../ui/Modal';

interface AdminCategoriesProps {
  categories: Category[];
  onRefresh: () => void;
  onShowToast: (msg: string) => void;
}

export const AdminCategories: React.FC<AdminCategoriesProps> = ({ categories, onRefresh, onShowToast }) => {
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#145EDB');
  const [iconName, setIconName] = useState('Tag');

  const handleOpenNew = () => {
    setEditingCat(null);
    setName('');
    setDescription('');
    setColor('#145EDB');
    setIconName('Tag');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCat(cat);
    setName(cat.name);
    setDescription(cat.description);
    setColor(cat.color);
    setIconName(cat.iconName);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja excluir esta categoria?')) {
      deleteCategory(id);
      onRefresh();
      onShowToast('Categoria removida.');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    saveCategory({
      id: editingCat ? editingCat.id : `cat-${Date.now()}`,
      name,
      slug,
      description,
      color,
      iconName,
      order: editingCat ? editingCat.order : categories.length + 1,
      featured: true
    });

    setIsModalOpen(false);
    onRefresh();
    onShowToast(`Categoria "${name}" salva com sucesso!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0B2343]">Gerenciador de Categorias</h1>
          <p className="text-sm text-[#5C6B7A]">Configure as editorias do portal GRIT NEWS</p>
        </div>

        <button
          onClick={handleOpenNew}
          className="bg-[#145EDB] hover:bg-[#0f4eb8] text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Categoria</span>
        </button>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9FC] border-b border-[#E2E8F0] text-[#0B2343] font-extrabold uppercase">
              <tr>
                <th className="p-4">Cor</th>
                <th className="p-4">Nome da Categoria</th>
                <th className="p-4">Slug / URL</th>
                <th className="p-4">Descrição</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#10233F]">
              {categories.map(cat => (
                <tr key={cat.id} className="hover:bg-[#F7F9FC]">
                  <td className="p-4">
                    <span className="w-6 h-6 rounded-full inline-block border border-gray-200" style={{ backgroundColor: cat.color }} />
                  </td>
                  <td className="p-4 font-bold text-[#0B2343]">{cat.name}</td>
                  <td className="p-4 text-gray-500">/{cat.slug}</td>
                  <td className="p-4 text-gray-500 max-w-xs truncate">{cat.description}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleOpenEdit(cat)} className="p-1.5 text-[#145EDB]">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Editar Categoria">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#0B2343] mb-1">Nome da Categoria *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0B2343] mb-1">Descrição</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0B2343] mb-1">Cor da Categoria</label>
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="w-16 h-10 p-1 rounded-lg border border-[#E2E8F0] cursor-pointer"
            />
          </div>
          <button type="submit" className="w-full bg-[#145EDB] text-white font-bold py-2.5 rounded-xl text-xs shadow-md">
            Salvar Categoria
          </button>
        </form>
      </Modal>
    </div>
  );
};
