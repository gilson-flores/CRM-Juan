import { useState, useEffect, useCallback } from 'react';

declare const google: any;

const CLIENT_ID = process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID;
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4", "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file";

export function useGoogleSheets() {
  const [token, setToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Check if there is a saved spreadsheet ID
      const savedId = localStorage.getItem('@jc-eletricista:spreadsheetId');
      if (savedId) setSpreadsheetId(savedId);
      setIsInitializing(false);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const login = useCallback(() => {
    if (!CLIENT_ID) {
      console.error('Missing NEXT_PUBLIC_OAUTH_CLIENT_ID');
      alert('OAuth Client ID is not configured.');
      return;
    }

    const client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response: any) => {
        if (response.error !== undefined) {
          throw response;
        }
        setToken(response.access_token);
      },
    });
    client.requestAccessToken();
  }, []);

  const createSpreadsheet = async () => {
    if (!token) return null;
    try {
      const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            title: 'JC Eletricista CRM Data',
          },
          sheets: [
            { properties: { title: 'Clientes' } },
            { properties: { title: 'Orcamentos' } }
          ]
        })
      });
      const data = await response.json();
      const id = data.spreadsheetId;
      setSpreadsheetId(id);
      localStorage.setItem('@jc-eletricista:spreadsheetId', id);
      return id;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const syncDataToSheets = async (sheetName: string, values: any[][]) => {
    if (!token) return;
    let currentId = spreadsheetId;
    if (!currentId) {
      currentId = await createSpreadsheet();
      if (!currentId) return;
    }

    try {
      // Clear current sheet
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${currentId}/values/${sheetName}!A:Z:clear`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // Update with new values
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${currentId}/values/${sheetName}!A1?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: values,
        }),
      });
    } catch (e) {
      console.error('Failed to sync to sheets', e);
    }
  };

  const fetchDataFromSheets = async (sheetName: string) => {
    if (!token || !spreadsheetId) return null;
    try {
      const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A:Z`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      return data.values || [];
    } catch (e) {
      console.error('Failed to fetch from sheets', e);
      return null;
    }
  };

  return {
    login,
    token,
    isInitializing,
    spreadsheetId,
    syncDataToSheets,
    fetchDataFromSheets
  };
}
