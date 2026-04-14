import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000,
});

export const uploadFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Server error");
  }
};

export const sendQuery = async (query, fileId) => {
  try {
    const response = await apiClient.post('/query', {
      query,
      file_id: fileId,
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Server error");
  }
};
