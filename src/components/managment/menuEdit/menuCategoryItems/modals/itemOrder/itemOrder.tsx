import { Button, message, Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons';
import { ILanguage, IMenuCategoryItems, ISubCategory } from '../../../../../../interfaces/interfaces';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../../../firebaseConfig';

interface IItemOrderProps {
  isModalVisible: boolean;
  onCancel: () => void;
  establishmentId: any;
  userId: any;
  menuItems: IMenuCategoryItems[];
  categoryId: any;
  currentLanguage: ILanguage;
  subCategories?: ISubCategory[] | null;
}

const ItemOrder: React.FC<IItemOrderProps> = ({
  isModalVisible,
  onCancel,
  establishmentId,
  userId,
  menuItems,
  categoryId,
  currentLanguage,
  subCategories,
}) => {
  const [menuItem0, setMenuItems] = useState<Record<string, IMenuCategoryItems[]>>({});
  useEffect(() => {
    if (menuItems) {
      const groupedItems = menuItems.reduce((acc, item) => {
        const subCategoryId = item.subCategoryId || 'Others';
        if (!acc[subCategoryId]) {
          acc[subCategoryId] = [];
        }
        acc[subCategoryId].push(item);
        return acc;
      }, {} as Record<string, IMenuCategoryItems[]>);
      setMenuItems(groupedItems);
    }
  }, [menuItems]);

  const handleMoveUp = (id: string) => {
    setMenuItems((prev) => {
      const newItems = { ...prev };
      const subCategoryId = Object.keys(prev).find((key) =>
        prev[key].some((item) => item.id === id)
      );
      if (!subCategoryId) return prev;
      const subCategoryItems = [...newItems[subCategoryId]];
      const index = subCategoryItems.findIndex((item) => item.id === id);
      if (index > 0) {
        const [movedItem] = subCategoryItems.splice(index, 1);
        subCategoryItems.splice(index - 1, 0, movedItem);
        newItems[subCategoryId] = subCategoryItems;
      }
      return newItems;
    });
  };

  const handleMoveDown = (id: string) => {
    setMenuItems((prev) => {
      const newItems = { ...prev };
      const subCategoryId = Object.keys(prev).find((key) =>
        prev[key].some((item) => item.id === id)
      );
      if (!subCategoryId) return prev;
      const subCategoryItems = [...newItems[subCategoryId]];
      const index = subCategoryItems.findIndex((item) => item.id === id);

      if (index < subCategoryItems.length - 1) {
        const [movedItem] = subCategoryItems.splice(index, 1);
        subCategoryItems.splice(index + 1, 0, movedItem);
        newItems[subCategoryId] = subCategoryItems;
      }
      return newItems;
    });
  };

  const handleSaveOrder = async () => {
    if (!userId || !establishmentId) {
      return;
    }
    const docRef = doc(db, 'users', userId, 'establishments', establishmentId);

    try {
      await Promise.all(
        Object.keys(menuItem0).flatMap((subCategoryId) =>
          menuItem0[subCategoryId].map((item, index) =>
            updateDoc(docRef, {
              [`menu.items.${categoryId}.${item.id}`]: { ...item, order: index },
            })
          )
        )
      );
      message.success('')
      onCancel();
    } catch (error) {
      return;
    }
  };

  return (
    <Modal title="Change Menu Item Order" open={isModalVisible} onCancel={onCancel} footer={null}>
      {subCategories && Object.values(subCategories).length > 0 ? (
        <>
          {Object.values(subCategories).map((subCategory) => {
            const itemsInSubCategory = menuItems.filter(
              (item) => item.subCategoryId === subCategory.id
            );

            return itemsInSubCategory.length > 0 ? (
              <div key={subCategory.id}>
                <h1 style={{ width: '100%', fontSize: '18px', marginBottom: 0 }}>
                  {subCategory.name[currentLanguage]}
                </h1>
                {itemsInSubCategory.map((item) => (
                  <div key={item.id}>
                    <span style={{ fontSize: '16px' }}>{item.name[currentLanguage]}</span>
                    <Button
                      disabled={itemsInSubCategory[0].id === item.id}
                      onClick={() => handleMoveUp(item.id)}>
                      <CaretUpOutlined />
                    </Button>
                    <Button
                      disabled={itemsInSubCategory[itemsInSubCategory.length - 1].id === item.id}
                      onClick={() => handleMoveDown(item.id)}>
                      <CaretDownOutlined />
                    </Button>
                  </div>
                ))}
              </div>
            ) : null;
          })}
          {menuItems.some((item) => !item.subCategoryId || !subCategories?.[Number(item.subCategoryId)]) && (
            <div>
              <h1 style={{ fontSize: '18px' }}>Others</h1>
              {Object.values(menuItem0)
                .flat()
                .filter((item) => !item.subCategoryId || !subCategories?.[Number(item.subCategoryId)])
                .map((item, index, othersArray) => (
                  <div key={item.id}>
                    <span style={{ fontSize: '16px' }}>{item.name[currentLanguage]}</span>
                    <div style={{display: 'inline-block'}}> 
                      <Button
                        disabled={index === 0}
                        onClick={() => handleMoveUp(item.id)}
                      >
                        <CaretUpOutlined />
                      </Button>
                      <Button
                        disabled={index === othersArray.length - 1}
                        onClick={() => handleMoveDown(item.id)}
                      >
                        <CaretDownOutlined />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </>
      ) : (
        <div>
          {Object.values(menuItem0)
            .flat()
            .map((item, index, allItems) => (
              <div
                key={item.id}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>{item.name[currentLanguage]}</span>
                <div style={{display: 'inline-block'}}>
                  <Button
                    disabled={index === 0}
                    onClick={() => handleMoveUp(item.id)}
                  >
                    <CaretUpOutlined />
                  </Button>
                  <Button
                    disabled={index === allItems.length - 1}
                    onClick={() => handleMoveDown(item.id)}
                  >
                    <CaretDownOutlined />
                  </Button>
                </div>
              </div>
            ))}
        </div>
      )}
      <Button type="primary" style={{ marginTop: '10px' }} onClick={handleSaveOrder}>
        Save Order
      </Button>
    </Modal>
  );
};

export default ItemOrder;
