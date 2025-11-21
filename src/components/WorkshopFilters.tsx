import React, { useState } from 'react';                                             // Importa React e useState
import { Input } from '@/components/ui/input';                                       // Campo de texto padrão
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Componentes de select
import { Button } from '@/components/ui/button';                                     // Botão estilizado
import { Card, CardContent } from '@/components/ui/card';                            // Componente de card
import { Search, Filter, X } from 'lucide-react';                                    // Ícones usados na UI

// Props recebidas pelo filtro de workshops
interface WorkshopFiltersProps {
  onFiltersChange: (filters: any) => void;                                           // Callback para retornar filtros atualizados ao componente pai
}

// Componente principal de filtros de workshop
const WorkshopFilters: React.FC<WorkshopFiltersProps> = ({ onFiltersChange }) => {
  // Estado dos filtros aplicados
  const [filters, setFilters] = useState({
    name: '',                                                                        // Filtro por nome do workshop
    status: '',                                                                      // Filtro por status
    creator: '',                                                                     // Filtro por criador
    dateRange: ''                                                                    // Filtro por intervalo de datas
  });

  // Controla se os filtros avançados estão visíveis
  const [showFilters, setShowFilters] = useState(false);

  // Atualiza um filtro específico (por chave)
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };                                 // Clona e atualiza o filtro desejado
    setFilters(newFilters);                                                          // Atualiza estado interno
    onFiltersChange(newFilters);                                                     // Notifica o componente pai
  };

  // Limpa todos os filtros
  const clearFilters = () => {
    const emptyFilters = {
      name: '',                                                                       // Reseta cada filtro
      status: '',
      creator: '',
      dateRange: ''
    };
    setFilters(emptyFilters);                                                         // Atualiza estado
    onFiltersChange(emptyFilters);                                                    // Notifica o pai
    setShowFilters(false);                                                            // Fecha filtros avançados
  };

  // Verifica se existe algum filtro ativo
  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="space-y-4">                                                      {/* Container com espaçamento */}
      
      {/* Barra de busca principal */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">                                             {/* Campo de busca ocupa toda a largura */}
          <Search 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
          />                                                                           {/* Ícone dentro do input */}
          
          <Input
            placeholder="Search workshops..."                                          // Placeholder
            value={filters.name}                                                      // Valor atual do filtro
            onChange={(e) => handleFilterChange('name', e.target.value)}              // Atualiza filtro
            className="pl-10"                                                         // Espaço para o ícone
          />
        </div>

        {/* Botão que abre/fecha os filtros avançados */}
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? 'bg-blue-50 text-blue-600 border-blue-200' : ''}   // Destaque quando ativo
        >
          <Filter className="h-4 w-4 mr-2" />                                         {/* Ícone */}
          Filters
        </Button>

        {/* Botão para limpar filtros */}
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters} size="sm">
            <X className="h-4 w-4 mr-1" />                                            {/* Ícone de limpar */}
            Clear
          </Button>
        )}
      </div>

      {/* Filtros avançados */}
      {showFilters && (
        <Card className="border-blue-100">                                            {/* Box dos filtros avançados */}
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">                   {/* Layout responsivo */}
              
              {/* Filtro por status */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Status
                </label>
                <Select 
                  value={filters.status} 
                  onValueChange={(value) => handleFilterChange('status', value)}      // Atualiza filtro
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por criador */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Creator
                </label>
                <Input
                  placeholder="Creator name or email"
                  value={filters.creator}
                  onChange={(e) => handleFilterChange('creator', e.target.value)}      // Atualiza
                />
              </div>

              {/* Filtro por intervalo de datas */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Date Range
                </label>
                <Select 
                  value={filters.dateRange} 
                  onValueChange={(value) => handleFilterChange('dateRange', value)}    // Atualiza
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All dates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All dates</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This week</SelectItem>
                    <SelectItem value="month">This month</SelectItem>
                    <SelectItem value="quarter">This quarter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WorkshopFilters;                                                      // Exporta componente
