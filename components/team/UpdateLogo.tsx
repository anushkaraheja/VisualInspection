import toast from 'react-hot-toast';
import { useTranslation } from 'next-i18next';
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUpCircleIcon } from '@heroicons/react/24/outline';
import type { ApiResponse } from 'types';
import type { Team } from '@prisma/client';
import { Card } from '@/components/shared';
import { defaultHeaders } from '@/lib/common';
import ButtonFromTheme from '../shared/ButtonFromTheme';
import app from '@/lib/app';
import useLogoFromTheme from 'hooks/useLogoFromTheme';

const UpdateLogo = ({ team }: { team: Team }) => {
  const { t } = useTranslation('common');
  const [dragActive, setDragActive] = useState(false);
  const [logo, setLogo] = useState<string | null>();
  const [loading, setLoading] = useState(false);
  const { logo: logoFromTheme } = useLogoFromTheme(team.slug);

  useEffect(() => {
    setLogo(logoFromTheme || app.logoUrl);
  }, [logoFromTheme]);

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files && e.dataTransfer.files[0];

    if (file) {
      onLogoUpload(file);
    }
  };

  const onChangePicture = useCallback((e) => {
    const file = e.target.files[0];

    if (file) {
      onLogoUpload(file);
    }
  }, []);

  const onLogoUpload = (file: File) => {
    if (file.size / 1024 / 1024 > 2) {
      toast.error('File size too big (max 2MB)');
      return;
    }

    if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
      toast.error('File type not supported (.png or .jpg only)');
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      setLogo(e.target?.result as string);
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const response = await fetch(
      `/api/teams/${team.slug}/orgTheme?element=logo`,
      {
        method: 'PUT',
        headers: defaultHeaders,
        body: JSON.stringify({ logo }),
      }
    );

    setLoading(false);

    if (!response.ok) {
      const json = (await response.json()) as ApiResponse;
      toast.error(json.error.message);
      return;
    }

    toast.success(t('successfully-updated'));
    window.location.reload();
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <Card.Body>
          <Card.Header>
            <Card.Title>{t('Logo')}</Card.Title>
            <Card.Description>
              {t('Click on the logo to upload a custom one from your files.')}{' '}
              <br />
              {t('Accepted file types: .png, .jpg. Max file size: 2MB.')}
            </Card.Description>
          </Card.Header>
          <div>
            <label
              htmlFor="logo"
              className="group relative mt-1 flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-full border border-gray-300 bg-white transition-all hover:bg-gray-50"
            >
              <div
                className="absolute z-[5] h-full w-full rounded-full"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(true);
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(false);
                }}
                onDrop={onDrop}
              />
              <div
                className={`${
                  dragActive
                    ? 'cursor-copy border-2 border-black bg-gray-50 opacity-100'
                    : ''
                } absolute z-[3] flex h-full w-full flex-col items-center justify-center rounded-full bg-white transition-all ${
                  logo
                    ? 'opacity-0 group-hover:opacity-100'
                    : 'group-hover:bg-gray-50'
                }`}
              >
                <ArrowUpCircleIcon
                  className={`${
                    dragActive ? 'scale-110' : 'scale-100'
                  } h-50 w-50 text-gray-500 transition-all duration-75 group-hover:scale-110 group-active:scale-95`}
                />
              </div>
              {logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo}
                  alt={team.name}
                  className="h-full w-full rounded-full object-cover"
                />
              )}
            </label>
            <div className="mt-1 flex rounded-full shadow-sm">
              <input
                id="logo"
                name="logo"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={onChangePicture}
              />
            </div>
          </div>
        </Card.Body>
        <Card.Footer>
          <ButtonFromTheme
            loading={loading}
            type="submit"
            disabled={!logo || logo === logoFromTheme}
          >
            {t('save-changes')}
          </ButtonFromTheme>
        </Card.Footer>
      </Card>
    </form>
  );
};

export default UpdateLogo;
