import { Button, Form, Input, InputRef, message, Modal, Select, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import React, { useEffect, useRef, useState } from 'react';
import { ILanguage, IMenuCategoryItems, ISubCategory, ITranslation } from '../../../../../../interfaces/interfaces';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { db, storage } from '../../../../../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import defimg from '../../../../../../assets/img/pngwi.png';

const { Option } = Select;

interface IAddProps {
  isModalVisible: boolean;
  onCancel: () => void;
  establishmentId: any;
  userId: any;
  menuItemsLength: number;
  categoryId: any;
  currentLanguage: ILanguage;
  subCategories?: ISubCategory[] | null;
}

const Create: React.FC<IAddProps> = ({
  isModalVisible,
  onCancel,
  userId,
  establishmentId,
  menuItemsLength,
  categoryId,
  currentLanguage,
  subCategories = [],
}) => {
  const [newItem, setNewItem] = useState<Partial<IMenuCategoryItems> & { name: ITranslation, description: ITranslation, img?: string | null, order: number,isVisible: boolean, showImg: boolean , subCategoryId?: string}>(
    {
      name: { en: '', am: '', ru: '' },
      description: { en: '', am: '', ru: '' },
      img: null,
      order: 0,
      subCategoryId: undefined,
      showImg: true,
      isVisible: true
    }
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<InputRef | null>(null); 
  
  useEffect(() => {
    if (isModalVisible && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      });
    }
  }, [isModalVisible]);

  const handleNewItemSubmit = async () => {
    if (!userId || !establishmentId) {
      message.error('User or establishment ID is missing');
      return;
    }
    setUploading(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        const imgId = Date.now().toString();
        const storageRef = ref(storage, `establishments/${establishmentId}/items/${imgId}`);
        const uploadTask = uploadBytesResumable(storageRef, imageFile);
        await uploadTask;
        imageUrl = await getDownloadURL(storageRef);
      }
      if (!imageUrl) {
        imageUrl = defimg;
      }

      const uniqueId = Date.now().toString();
      const docRef = doc(db, 'users', userId, 'establishments', establishmentId);
      console.log(uniqueId)

      await updateDoc(docRef, {
        [`menu.items.${categoryId}.${uniqueId}`]: {
          name: newItem.name,
          description: newItem.description,
          price: newItem.price,
          img: imageUrl,
          order: menuItemsLength,
          subCategoryId: 'other',
        },
      });

      onCancel();
      setNewItem({
        name: { en: '', am: '', ru: '' },
        description: { en: '', am: '', ru: '' },
        img: null,
        order: 0,
        subCategoryId: 'other',
        isVisible: true, 
        showImg: true
      });
      setFileList([]); 
      setUploading(false);
    } catch (error) {
      message.error('Error saving item');
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = (file: File) => {
    setImageFile(file);
    setFileList([file]);
    return false;
  };
  return (
    <Modal title="Create New Item" open={isModalVisible} onCancel={onCancel} footer={null}>
      <Form layout="vertical">
        <Form.Item label="Item Name" required>
          <Input
            placeholder="Item Name"
            maxLength={21}
            ref={inputRef}
            value={newItem.name[currentLanguage] || ''}
            onChange={(e) =>
              setNewItem({
                ...newItem,
                name: {
                  ...newItem.name,
                  en: e.target.value || '',
                  am: e.target.value || '',
                  ru: e.target.value || ''
                } as ITranslation,
              })
            }
          />
        </Form.Item>
        <Form.Item label="Item Description">
          <Input
            placeholder="Item Description"
            value={newItem.description[currentLanguage] || ''}
            onChange={(e) =>
              setNewItem({
                ...newItem,
                description: {
                  ...newItem.description,
                  en: e.target.value || '',
                  am: e.target.value || '',
                  ru: e.target.value || ''
                } as ITranslation,
              })
            }
          />
        </Form.Item>
        <Form.Item label="Price" required>
          <Input
            type="number"
            placeholder="Price"
            value={newItem.price || ''}
            onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
          />
        </Form.Item>
        
        {subCategories?.length && (
          <Form.Item label="Select SubCategory">
            <Select
              placeholder="Select SubCategory"
              onChange={(value) => setNewItem({ ...newItem, subCategoryId: value })}
              value={newItem.subCategoryId || undefined}
            >
              {Object.values(subCategories).map((subCategory) => (
                <Option key={subCategory.id} value={subCategory.id}>
                  {subCategory.name[currentLanguage]}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Form.Item label="Image Upload">
          <Upload
            beforeUpload={handleImageUpload}
            maxCount={1}
            listType="picture"
            fileList={fileList}
            onRemove={() => {
              setFileList([]);
              setImageFile(null);
            }}
          >
            <Button icon={<UploadOutlined />}>Upload</Button>
          </Upload>
        </Form.Item>
        <Form.Item>
          <Button type="primary" loading={uploading} onClick={handleNewItemSubmit}>
            Create
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default Create;
