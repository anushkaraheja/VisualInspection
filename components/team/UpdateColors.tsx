import { Card } from '@/components/shared';
import useColors from 'hooks/useColors';
import useTheme from 'hooks/useTheme';
import { useTranslation } from 'next-i18next';
import { useEffect, useState } from 'react';
import ButtonFromTheme from '@/components/shared/ButtonFromTheme';
import { FaEyeDropper } from 'react-icons/fa';
import { Team } from '@prisma/client';
import useOrgTheme from 'hooks/useOrgTheme';

const predefinedColors = [
  '#A0C1B9',
  '#FF4A1C',
  '#3F2A2B',
  '#D5A021',
  '#B191FF',
  '#FF33A1',
  '#33658A',
];

const UpdateColors = ({ team }: { team: Team }) => {
  const { primaryColor, secondaryColor, applyColor } = useColors();
  const { theme } = useTheme();
  const { theme: orgTheme } = useOrgTheme(team.slug);
  const { t } = useTranslation('common');
  const [customPrimaryColor, setCustomPrimaryColor] = useState<string | null>(
    primaryColor
  );
  const [customSecondaryColor, setCustomSecondaryColor] = useState<
    string | null
  >(secondaryColor);
  const handlePrimaryColorChange = (color: string) => {
    setCustomPrimaryColor(color);
  };

  const handleSecondaryColorChange = (color: string) => {
    setCustomSecondaryColor(color);
  };

  useEffect(() => {
    handlePrimaryColorChange(orgTheme.primaryColor);
    handleSecondaryColorChange(orgTheme.secondaryColor);
  }, [orgTheme]);

  const isSaveDisabled =
    customPrimaryColor === orgTheme.primaryColor &&
    customSecondaryColor === orgTheme.secondaryColor;

  const saveChanges = async () => {
    if (customPrimaryColor) applyColor('primary', customPrimaryColor);
    if (customSecondaryColor) applyColor('secondary', customSecondaryColor);

    try {
      const response = await fetch(
        `/api/teams/${team.slug}/orgTheme?element=colors`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            primaryColor: customPrimaryColor,
            secondaryColor: customSecondaryColor,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update colors');
      }

      window.location.reload();
    } catch (error) {
      console.error('Failed to update colors:', error);
    }
  };

  const defaultPickerColor = theme === 'dark' ? '#FFFFFF' : '#000000';

  return (
    <Card>
      <Card.Body>
        <Card.Header>
          <Card.Title>{t('Colors')}</Card.Title>
          <Card.Description>{t('Change Colors')}</Card.Description>
        </Card.Header>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-medium">{t('Primary color')}</label>
            <div className="flex gap-2 items-center">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  className="w-8 h-8 rounded-full border"
                  style={{ backgroundColor: color }}
                  onClick={() => handlePrimaryColorChange(color)}
                />
              ))}
              <div className="w-px h-8 bg-gray-300 dark:bg-textColor mx-2"></div>
              <div className="relative">
                <input
                  type="color"
                  value={customPrimaryColor || defaultPickerColor}
                  onChange={(e) => handlePrimaryColorChange(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
                <div className="w-8 h-8 rounded-full border flex items-center justify-center">
                  <FaEyeDropper
                    color={customPrimaryColor || defaultPickerColor}
                  />
                </div>
              </div>
              <div
                className="w-8 h-8 rounded-full border flex items-center justify-center"
                style={{ backgroundColor: orgTheme.primaryColor }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium">{t('Secondary Color')}</label>
            <div className="flex gap-2 items-center">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  className="w-8 h-8 rounded-full border"
                  style={{ backgroundColor: color }}
                  onClick={() => handleSecondaryColorChange(color)}
                />
              ))}
              <div className="w-px h-8 bg-gray-300 dark:bg-textColor mx-2"></div>
              <div className="relative">
                <input
                  type="color"
                  value={customSecondaryColor || defaultPickerColor}
                  onChange={(e) => handleSecondaryColorChange(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
                <div className="w-8 h-8 rounded-full border flex items-center justify-center">
                  <FaEyeDropper
                    color={customSecondaryColor || defaultPickerColor}
                  />
                </div>
              </div>
              <div
                className="w-8 h-8 rounded-full border flex items-center justify-center"
                style={{ backgroundColor: orgTheme.secondaryColor }}
              />
            </div>
          </div>
        </div>
      </Card.Body>
      <Card.Footer>
        <ButtonFromTheme
          onClick={saveChanges}
          className="btn w-auto"
          disabled={isSaveDisabled}
        >
          {t('Save Changes')}
        </ButtonFromTheme>
      </Card.Footer>
    </Card>
  );
};

export default UpdateColors;
