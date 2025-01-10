import { Button, Checkbox, Modal, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { ILanguage, ILanguages } from '../../../../../interfaces/interfaces';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../../firebaseConfig';
import { useTranslation } from 'react-i18next';

interface ILanguagesEstablishmentProps {
    isModalVisible: boolean;
    onCancel: () => void;
    selectedLanguages: ILanguages;
    selectedEstablishmentId: any;
    userId: any;
}

const LanguagesEstablishment: React.FC<ILanguagesEstablishmentProps> = ({
  isModalVisible,
  onCancel,
  selectedLanguages,
  selectedEstablishmentId,
  userId,
}) => {
  const { t } = useTranslation('global');
  const [selectedLanguagesNow, setSelectedLanguages] = useState({
    am: selectedLanguages.am,
    en: selectedLanguages.en,
    ru: selectedLanguages.ru,
  });

  useEffect(() => {
    setSelectedLanguages(selectedLanguages);
  }, [selectedLanguages]);

  const handleCheckboxChange = (language: ILanguage) => {
    setSelectedLanguages((prevState) => ({
      ...prevState,
      [language]: !prevState[language],
    }));
  };

  const handleSaveLanguages = async () => {
    if (userId && selectedEstablishmentId) {
      const showImgRef = doc(db, 'users', userId, 'establishments', selectedEstablishmentId);

      try {
        await updateDoc(showImgRef, {
          languages: selectedLanguagesNow,
        });
        message.success('');
        onCancel();
      } catch (error) {
        message.error('');
      }
    }
  };

  return (
    <Modal
      title={t('Languages Establishment')}
      open={isModalVisible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {t('Cancel')}
        </Button>,
        <Button key="save" type="primary" onClick={handleSaveLanguages}>
          {t('OK')}
        </Button>,
      ]}
    >
      <Checkbox
        checked={selectedLanguagesNow.am}
        onChange={() => handleCheckboxChange('am')}
      >
        Հայերեն
      </Checkbox>
      <Checkbox
        checked={selectedLanguagesNow.en}
        onChange={() => handleCheckboxChange('en')}
      >
        English
      </Checkbox>
      <Checkbox
        checked={selectedLanguagesNow.ru}
        onChange={() => handleCheckboxChange('ru')}
      >
        Русский
      </Checkbox>
    </Modal>
  );
};

export default LanguagesEstablishment;
