import React, { useEffect, useState } from 'react';
import { Modal, Button, message, Popover, Switch, Card } from 'antd';
import { EditOutlined, OrderedListOutlined } from '@ant-design/icons';
import { updateDoc, getDoc, deleteField, doc } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import styles from './style.module.css';
import defimg from '../../../../assets/img/pngwi.png'
import { useLocation } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { IEstablishmentStyles, ILanguage, IMenuCategoryItems, ISubCategory, ITranslation } from '../../../../interfaces/interfaces';
import Create from './modals/create/create';
import Edit from './modals/edit/edit';
import ItemOrder from './modals/itemOrder/itemOrder';
import { useTranslation } from 'react-i18next';
import i18n from '../../../../translations/i18n';
import SubCategory from '../subCategory/subCategory';
import amTranslations from '../../../../translations/am/common.json';
import enTranslations from '../../../../translations/en/common.json';
import ruTranslations from '../../../../translations/ru/common.json';

const MenuCategoryItems: React.FC = () => {
  const [menuItems, setMenuItems] = useState<IMenuCategoryItems[]>([]);
  const [visiblePopoverId , setVisiblePopoverId] =  useState<string | null>(null);
  const [, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalDescriptionVisibale , setModalDescriptionVisible] = useState(false);
  const  [editModalvisibal , setEditModalVisible] = useState(false);
  const [newItem, setNewItem] = useState<Partial<IMenuCategoryItems> & {id: any, name: ITranslation, description: ITranslation  , img?: string | null, order: number , isVisible: boolean, subCategoryId: string }>({ 
    name: { en: '', am: '', ru: '' },
    description: { en: '', am: '', ru: '' },
    img: null,
    order: 0,
    isVisible: true,
    id: '',
    subCategoryId: ''
  }); 
  const { Meta } = Card;
  const [currentEditingId, setCurrentEditingId] = useState<string | null>(null);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [establishmentStyles, setEstablishmentStyles] = useState<IEstablishmentStyles>();
  const [currency, setCurrency] = useState<string>('');
  const pathname = useLocation().pathname || '';
  const establishmentId = pathname.split('/')[pathname.split('/').length - 2];
  const categoryId = pathname.split('/')[pathname.split('/').length - 1];
  const [userId, setUserId] = useState<string | null>(null);  
  const [currentLanguage, setCurrentLanguage] = useState<ILanguage>('en');
  const [subCategories , setSubCategories] = useState<ISubCategory[] | null>([]);
  const { t } = useTranslation("global");
  const [showImg, setShowImg] = useState<boolean>(true);
  const others = {
    am: amTranslations.Others,
    en: enTranslations.Others,
    ru: ruTranslations.Others,
  };

  useEffect(() => {
    const savedLanguage = localStorage.getItem('menuLanguage');
    if (savedLanguage === 'en' || savedLanguage === 'am' || savedLanguage === 'ru') {
      setCurrentLanguage(savedLanguage);
    } else {
      localStorage.setItem('menuLanguage', 'en');
    }
  }, [currentLanguage]);
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language'); 
    if (savedLanguage && i18n?.changeLanguage) {
      i18n.changeLanguage(savedLanguage); 
    }
  }, []);
  useEffect(()=>{},[newItem , menuItems , currentEditingId])
  useEffect(() => {
    const auth = getAuth();
    
    const unsubscribeAuth = onAuthStateChanged(auth, (user:any) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null); 
      }
    });

    return () => unsubscribeAuth();
  }, []);
  useEffect(() => {
    const fetchMenuItems = async () => {
      if (userId && establishmentId && categoryId) {
        try {
          const docRef = doc(db, 'users', userId, 'establishments', establishmentId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            const menuItems = data.menu?.items || {};
            const categoryItems = menuItems[categoryId] || {};
            
            setCurrency(data.info.currency);
            setEstablishmentStyles(data.styles);
            const category = data.menu.categories?.[categoryId];
            setSubCategories(category.subCategories)
            setShowImg(category?.showImg || false);
            const items: IMenuCategoryItems[] = Object.entries(categoryItems).map(
              ([id, menuItem]: any) => ({
                id,
                name: menuItem.name,
                description: menuItem.description,
                img: menuItem.img,
                order: menuItem.order,
                price: menuItem.price,
                isVisible: menuItem.isVisible ?? true,
                subCategoryId: menuItem.subCategoryId
              })
            );
            items.sort((a, b) => a.order - b.order);
            setMenuItems(items);
          } else {
            setError('No data found');
          }
        } catch (error) {
          setError('Error fetching data');
        }
      }
    };
    
    fetchMenuItems();
  }, [userId, establishmentId, categoryId , modalVisible , editModalvisibal , orderModalVisible]);

  const handleToggleVisibility = async (id: string, isVisible: boolean) => {
    setModalDescriptionVisible(false)
    if(!userId || !establishmentId){
      return;
    }
    try {
      const docRef = doc(db, 'users', userId, 'establishments', establishmentId);
      setMenuItems((menuItems) =>
        menuItems.map((item) =>
          item.id === id ? { ...item, isVisible } : item
        )
      );      
      await updateDoc(docRef, {
        [`menu.items.${categoryId}.${id}.isVisible`]: isVisible,
      });
      
      message.success(``);
    } catch (error) {
      message.error('');
    }
  };
  const handleDeleteConfirmation = (id: string) => {
    Modal.confirm({
      onOk: () => handleDelete(id),
      onCancel: () => null,
    });
  };
  

  const handleDelete = async (id: string) => {
    if ( !userId || !establishmentId || !categoryId) return;

    try {
      const docRef = doc(db,'users', userId , 'establishments', establishmentId);
      await updateDoc(docRef, {
        [`menu.items.${categoryId}.${id}`]: deleteField(),
      });
      setMenuItems((prev) => prev.filter(item => item.id !== id));
    } catch (error) {
    }
  };
  const popoverContent = (item: IMenuCategoryItems) => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 8 }}>
        <Switch 
          checkedChildren={t(`show`)} unCheckedChildren={t(`don't show`)}
          checked={item.isVisible} 
          onChange={(checked) => handleToggleVisibility(item.id, checked)}/>
      </div>
      <Button 
        onClick={(e) => { 
          e.stopPropagation(); 
          setVisiblePopoverId(null);
          setCurrentEditingId(item.id); 
          setNewItem({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            img: item.img,
            order: item.order,
            isVisible: item.isVisible,
            subCategoryId: item.subCategoryId
          });
          setEditModalVisible(true); 
        }} 
        style={{ marginBottom: 8 }}>
        Edit
      </Button>
      
      <Button 
        onClick={(e) => { 
          e.stopPropagation(); 
          setVisiblePopoverId(null);
          handleDeleteConfirmation(item.id);
        }}>
        Delete
      </Button>
    </div>
  );

  const showOrderModal = () => {
    setOrderModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false)
    setEditModalVisible(false)
    setOrderModalVisible(false)
    setModalDescriptionVisible(false)
    setCurrentEditingId(null);
  }  
  return (
    <div className={styles.menuCategoryItems} style={{backgroundColor: `#${establishmentStyles?.color1}` }}>
      <div className={styles.ordering}>
        <Button type="link" className={styles.orderButton} onClick={showOrderModal}><OrderedListOutlined /></Button>
      </div>
      <SubCategory/>
      <div className={styles.menuCategoryItemsList}>
      {subCategories && Object.values(subCategories).length > 0 ? (
  <>
    {Object.values(subCategories).map((subCategory) => {
  const itemsInSubCategory = menuItems.filter((item) => item.subCategoryId === subCategory.id);

  return itemsInSubCategory.length > 0 ? ( 
    <div key={subCategory.id}>
      <h1 style={{ width: '100%', color: `#${establishmentStyles?.color2}`, fontSize:'18px' , marginBottom: 0 }}>
        {subCategory.name[currentLanguage]}
      </h1>
      {itemsInSubCategory.map((item) => (
        <div
          key={item.id}
          className={styles.menuCategoryItem}
          style={{ border: `1px solid #${establishmentStyles?.color2}` }}
          onClick={(e) => {
            e.stopPropagation();
            setNewItem({
              id: item.id,
              name: item.name,
              description: item.description,
              price: item.price,
              img: item.img,
              order: item.order,
              isVisible: item.isVisible,
              subCategoryId: item.subCategoryId,
            });
          }}
        >
          <div
            className={styles.menuCategoryItemCart}
            onClick={() => setModalDescriptionVisible(true)}
          >
            <div
              className={styles.up}
              style={{
                height: establishmentStyles?.showImg && showImg ? '195px' : '40px',
              }}
            >
              {establishmentStyles?.showImg && showImg ? (
                <div className={styles.itemImg}>
                  <img src={item.img || defimg} alt={item.name[currentLanguage]} />
                </div>
              ) : null}
              <div className={styles.itemName}>
                <span style={{ color: `#${establishmentStyles?.color2}` , fontSize: '16px' }}>
                  {item.name[currentLanguage]}
                </span>
              </div>
              <div className={styles.itemPrice}>
                <span style={{ color: `#${establishmentStyles?.color2}`  , fontSize: '13px'}}>
                  {item.price} {currency}
                </span>
              </div>
            </div>
            <Popover
              content={popoverContent(item)}
              trigger="hover"
              placement="topRight"
              open={visiblePopoverId === item.id}
              onOpenChange={(visible) => setVisiblePopoverId(visible ? item.id : null)}
            >
              <Button
                type="primary"
                className={styles.functions}
                onClick={(e) => e.stopPropagation()}
              >
                <EditOutlined />
              </Button>
            </Popover>
          </div>
        </div>
      ))}
    </div>
  ) : null;
})}
    {menuItems.some((item) => !item.subCategoryId || !subCategories[Number(item.subCategoryId)]) && (
  <div>
    <h1 style={{ color: `#${establishmentStyles?.color2}` , fontSize: '18px'  }}>
      {others[currentLanguage]}
    </h1>
    {menuItems
      .filter((item) => !item.subCategoryId || !subCategories[Number(item.subCategoryId)])
      .map((item) => (
        <div
          key={item.id}
          className={styles.menuCategoryItem}
          style={{ border: `1px solid #${establishmentStyles?.color2}` }}
          onClick={(e) => {
            e.stopPropagation();
            setNewItem({
              id: item.id,
              name: item.name,
              description: item.description,
              price: item.price,
              img: item.img,
              order: item.order,
              isVisible: item.isVisible,
              subCategoryId: item.subCategoryId,
            });
          }}
        >
          <div
            className={styles.menuCategoryItemCart}
            onClick={() => setModalDescriptionVisible(true)}
          >
            <div
              className={styles.up}
              style={{
                height: establishmentStyles?.showImg && showImg ? '195px' : '40px',
              }}
            >
              {establishmentStyles?.showImg && showImg ? (
                <div className={styles.itemImg}>
                  <img
                    src={item.img || defimg}
                    alt={item.name[currentLanguage]}
                  />
                </div>
              ) : null}
              <div className={styles.itemName}>
                <span style={{ color: `#${establishmentStyles?.color2}` , fontSize: '16px' }}>
                  {item.name[currentLanguage]}
                </span>
              </div>
              <div className={styles.itemPrice}>
                <span style={{ color: `#${establishmentStyles?.color2}` , fontSize: '13px' }}>
                  {item.price} {currency}
                </span>
              </div>
            </div>
            <Popover
              content={popoverContent(item)}
              trigger="hover"
              placement="topRight"
              open={visiblePopoverId === item.id}
              onOpenChange={(visible) =>
                setVisiblePopoverId(visible ? item.id : null)
              }
            >
              <Button
                type="primary"
                className={styles.functions}
                onClick={(e) => e.stopPropagation()}
              >
                <EditOutlined />
              </Button>
            </Popover>
          </div>
        </div>
      ))}
  </div>
)}
  </>
  ): (
      menuItems.length > 0 ? (
        menuItems.map((item) => (
          <div key={item.id} className={styles.menuCategoryItem} onClick={(e) => { 
            e.stopPropagation(); 
            setNewItem({
              id: item.id,
              name: item.name,
              description: item.description,
              price: item.price,
              img: item.img,
              order: item.order,
              isVisible: item.isVisible,
              subCategoryId: item.subCategoryId
            });
          }} style={{border: `1px solid #${establishmentStyles?.color2}`}}>
            
            <div className={styles.menuCategoryItemCart} onClick={() => setModalDescriptionVisible(true)}>
              <div className={styles.up}   
                style={{ height: (establishmentStyles?.showImg && showImg) ? '195px' : '40px' }}>
                
                {(establishmentStyles?.showImg && showImg) ? (
                  <div className={styles.itemImg}>
                    <img
                      src={item.img || defimg}
                      alt={item.name[currentLanguage]}
                    />
                  </div>
                ) : null}

                <div className={styles.itemName}>
                  <span style={{ color: `#${establishmentStyles?.color2}`, fontSize: '16px' }}>
                    {item.name[currentLanguage]}
                  </span>
                </div>

                <div className={styles.itemPrice}>
                  <span style={{ color: `#${establishmentStyles?.color2}`, fontSize: '13px' }}>
                    {item.price} {currency}
                  </span>
                </div>
              </div>

              <Popover  
                content={popoverContent(item)}
                trigger="hover"
                placement="topRight"
                open={visiblePopoverId === item.id}
                onOpenChange={(visible) => setVisiblePopoverId(visible ? item.id : null)}>
                
                <Button type='primary' className={styles.functions} onClick={(e) => e.stopPropagation()}>
                  <EditOutlined />
                </Button>
              </Popover>
            </div>
          </div>
        ))
      ) : null
    )}
  </div>
      <Button type="primary" className={styles.addItem}  onClick={() => setModalVisible(true)}>
        Create New Item
      </Button>
      <Modal styles={{body: {backgroundColor: `#${establishmentStyles?.color1}`, width: 260 } , content: {backgroundColor: `#${establishmentStyles?.color1}`, width: '306px' , margin: 'auto'}
        }} open={modalDescriptionVisibale} onCancel={() => {setModalDescriptionVisible(false); }}footer={null} >
        <Card color={`#${establishmentStyles?.color2}`} cover={newItem.img && <img alt="" src={newItem.img} />}  style={{ width: 260, color: `#${establishmentStyles?.color2}` , background: 'none' , borderColor: `#${establishmentStyles?.color2}` }}>
          <Meta title={
                  <span style={{ color: `#${establishmentStyles?.color2}` }}>
                    {newItem.name[currentLanguage]}
                  </span>}
                description={
                  <span style={{ color: `#${establishmentStyles?.color2}` }}>
                    {newItem.description[currentLanguage]}
                  </span>}/>
        </Card>
      </Modal>    

      { modalVisible &&      <Create isModalVisible={modalVisible} onCancel={handleCancel} establishmentId={establishmentId} userId={userId} menuItemsLength={menuItems.length} categoryId={categoryId} currentLanguage={currentLanguage} subCategories={subCategories}/>}      
      { editModalvisibal &&  <Edit isModalVisible={editModalvisibal} onCancel={handleCancel} establishmentId={establishmentId} userId={userId} categoryId={categoryId} currentItem={newItem} currentItemId={currentEditingId} currentLanguage={currentLanguage} subCategories={subCategories}/>}
      { orderModalVisible && <ItemOrder isModalVisible={orderModalVisible} onCancel={handleCancel} establishmentId={establishmentId} userId={userId} menuItems={menuItems} categoryId={categoryId} currentLanguage={currentLanguage} subCategories={subCategories}/>}
    </div>
  );
};

export default MenuCategoryItems;
