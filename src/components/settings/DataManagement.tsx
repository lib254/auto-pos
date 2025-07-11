import React, { useState, useEffect } from 'react';
import { Upload, Download, AlertTriangle, Trash2, Check, X } from 'lucide-react';
import { storage } from '../../utils/storage';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';

export const DataManagement = () => {
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [showBackupReminder, setShowBackupReminder] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const lastBackup = localStorage.getItem('lastBackupDate');
    const today = new Date().toISOString().split('T')[0];
    if (lastBackup !== today) {
      setShowBackupReminder(true);
    }
  }, []);

  const handleExport = () => {
    setIsProcessing(true);
    try {
      const data = storage.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pos_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      // Save backup date
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('lastBackupDate', today);
      setShowBackupReminder(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const text = await file.text();
      const success = storage.importData(text);
      
      if (success) {
        setImportSuccess(true);
        setImportError(null);
        setTimeout(() => setImportSuccess(false), 3000);
      } else {
        setImportError('Invalid data format. Please ensure you selected a valid backup file.');
      }
    } catch (error) {
      setImportError('Failed to read file. Please try again.');
    } finally {
      setIsProcessing(false);
    }
    event.target.value = ''; // Reset input
  };

  const handleDeleteAll = () => {
    setIsProcessing(true);
    try {
      storage.clearData();
      setShowDeleteConfirm(false);
      // Optional: Show success message or refresh the app
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetSettings = () => {
    setIsProcessing(true);
    try {
      storage.resetToDefaults();
      setShowResetConfirm(false);
      // Optional: Show success message or refresh the app
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Backup Reminder */}
      {showBackupReminder && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-amber-800">Backup reminder</h3>
              <p className="text-sm text-amber-700 mt-1">
                You haven't created a backup today. We recommend exporting your data regularly.
              </p>
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={isProcessing}
                  className="border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isProcessing ? 'Exporting...' : 'Export Now'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import/Export Section */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Data Transfer</h2>
          <p className="text-sm text-gray-500 mt-1">Import or export your business data</p>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Import Data</h3>
              <label className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Select Backup File
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                  disabled={isProcessing}
                />
              </label>
              <p className="mt-2 text-xs text-gray-500">Select a previously exported JSON file</p>
              {importError && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1.5" />
                  {importError}
                </p>
              )}
              {importSuccess && (
                <p className="mt-2 text-sm text-green-600 flex items-center">
                  <Check className="w-4 h-4 mr-1.5" />
                  Data imported successfully!
                </p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Export Data</h3>
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={isProcessing}
              >
                <Download className="w-4 h-4 mr-2" />
                {isProcessing ? 'Exporting...' : 'Export All Data'}
              </Button>
              <p className="mt-2 text-xs text-gray-500">Download a complete backup of your system data</p>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg border border-red-200 overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-red-200 bg-red-50">
          <h2 className="text-lg font-semibold text-red-800 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
            Danger Zone
          </h2>
          <p className="text-sm text-red-600 mt-1">These actions are irreversible</p>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Reset to Default Settings</h3>
            <p className="text-sm text-gray-600 mb-3">Restore all system settings to their original defaults</p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowResetConfirm(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Reset Settings
            </Button>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Delete All Data</h3>
            <p className="text-sm text-gray-600 mb-3">Permanently remove all business data from the system</p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete All Data
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
              Confirm Data Deletion
            </DialogTitle>
            <DialogDescription className="mt-2">
              This will permanently delete all your business data including products, sales, and customer records. 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAll}
              disabled={isProcessing}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isProcessing ? 'Deleting...' : 'Delete All Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
              Confirm Settings Reset
            </DialogTitle>
            <DialogDescription className="mt-2">
              This will reset all system settings to their default values. Your business data will not be affected, 
              but all preferences will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleResetSettings}
              disabled={isProcessing}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isProcessing ? 'Resetting...' : 'Reset Settings'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};