import { BASE_URL, fetchWithCredentials, handleResponse, handleResponseAndGetData } from './common';
import { Category, SubCategory, Item } from '../../types';

export const categoriesApi = {
  getCategories: async (type?: string): Promise<Category[]> => {
    const url = type ? `${BASE_URL}/categories?type=${type}` : `${BASE_URL}/categories`;
    const response = await fetchWithCredentials(url);
    return handleResponseAndGetData(response);
  },

  getCategoriesPaginated: async (page: number = 0, type?: string, search?: string): Promise<{data: Category[], has_more: boolean}> => {
    let url = `${BASE_URL}/categories?page=${page}&size=50`;
    if (type) url += `&type=${type}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const response = await fetchWithCredentials(url);
    return handleResponse(response);
  },

  getSubCategories: async (categoryId: number): Promise<SubCategory[]> => {
    const response = await fetchWithCredentials(`${BASE_URL}/categories/${categoryId}/subcategories`);
    const data = await handleResponse(response);
    return data.data;
  },

  getAllSubCategoriesPaginated: async (page: number = 0, type?: string, search?: string): Promise<{data: SubCategory[], has_more: boolean}> => {
    let url = `${BASE_URL}/subcategories/all?page=${page}&size=50`;
    if (type) url += `&type=${type}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const response = await fetchWithCredentials(url);
    return handleResponse(response);
  },

  getItems: async (subCategoryId: number): Promise<Item[]> => {
    const response = await fetchWithCredentials(`${BASE_URL}/subcategories/${subCategoryId}/items`);
    const data = await handleResponse(response);
    return data.data;
  },

  getAllItemsPaginated: async (page: number = 0, type?: string, search?: string): Promise<{data: Item[], has_more: boolean}> => {
    let url = `${BASE_URL}/items/all?page=${page}&size=50`;
    if (type) url += `&type=${type}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const response = await fetchWithCredentials(url);
    return handleResponse(response);
  },

  addCategory: async (data: Partial<Category>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponseAndGetData(response);
  },

  addSubCategory: async (data: Partial<SubCategory>) => {
    const input = {
      ...data,
      category: {
        id: (data as any).categoryId
      }
    };
    delete (input as any).categoryId;
    const response = await fetchWithCredentials(`${BASE_URL}/subcategories`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return handleResponseAndGetData(response);
  },

  addItem: async (data: Partial<Item>) => {
    const input = {
      ...data,
      subcategory: {
        id: (data as any).subCategoryId
      }
    };
    delete (input as any).subCategoryId;
    const response = await fetchWithCredentials(`${BASE_URL}/items`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return handleResponseAndGetData(response);
  },

  updateCategory: async (data: Partial<Category>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/categories/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return handleResponseAndGetData(response);
  },

  updateSubCategory: async (data: Partial<SubCategory>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/subcategories/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return handleResponseAndGetData(response);
  },

  updateItem: async (data: Partial<Item>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/items/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return handleResponseAndGetData(response);
  },

  deleteCategory: async (id: number) => {
    const response = await fetchWithCredentials(`${BASE_URL}/categories/${id}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },

  deleteSubCategory: async (id: number) => {
    const response = await fetchWithCredentials(`${BASE_URL}/subcategories/${id}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },

  deleteItem: async (id: number) => {
    const response = await fetchWithCredentials(`${BASE_URL}/items/${id}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  }
};
