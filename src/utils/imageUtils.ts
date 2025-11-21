// Função responsável por comprimir uma imagem e convertê-la em Base64
// Recebe o arquivo original, as dimensões máximas permitidas e a qualidade (0 a 1)
// Retorna uma Promise que resolve com o Base64 da imagem comprimida
export const compressAndConvertToBase64 = (
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Cria um FileReader para ler o arquivo enviado
    const reader = new FileReader();

    // Lê o arquivo como uma string Base64 inicial
    reader.readAsDataURL(file);

    // Quando o FileReader terminar de carregar
    reader.onload = (event) => {
      // Cria um objeto Image para manipular a imagem carregada
      const img = new Image();
      img.src = event.target?.result as string;

      // Quando a imagem terminar de carregar
      img.onload = () => {
        // Cria um canvas para redesenhar a imagem com tamanho reduzido
        const canvas = document.createElement('canvas');

        // Obtém largura e altura originais
        let { width, height } = img;

        // Mantém proporção reduzindo pelo lado maior
        if (width > height) {
          // Caso a largura ultrapasse o máximo permitido
          if (width > maxWidth) {
            // Ajusta a altura proporcionalmente
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          // Caso a altura ultrapasse o máximo permitido
          if (height > maxHeight) {
            // Ajusta a largura proporcionalmente
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        // Define o tamanho final do canvas
        canvas.width = width;
        canvas.height = height;

        // Obtém o contexto de desenho do canvas
        const ctx = canvas.getContext('2d');

        // Se o contexto existir, desenha a imagem redimensionada
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Converte o canvas para Base64 com tipo JPEG e qualidade desejada
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          // Caso o contexto não exista, retorna erro
          reject(new Error('Failed to get canvas context'));
        }
      };

      // Captura erros ao carregar a imagem
      img.onerror = (error) => {
        reject(error);
      };
    };

    // Captura erros na leitura do arquivo pelo FileReader
    reader.onerror = (error) => {
      reject(error);
    };
  });
};
