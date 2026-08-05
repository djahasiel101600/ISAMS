/**
 * ISAMS - PostgreSQL Database Integration Management Panel
 * Provides database connection configuration, connection diagnostic testing,
 * live schema DDL generation, and PostgreSQL migration options.
 */

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Server, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Copy, 
  Check, 
  Download, 
  Code2, 
  HardDrive, 
  ShieldCheck, 
  Cpu, 
  Zap, 
  Terminal,
  Settings2
} from 'lucide-react';
import { api } from '../../services/api';

export const DatabaseIntegrationView: React.FC = () => {
  const [dbConfig, setDbConfig] = useState({
    host: 'localhost',
    port: '5432',
    database: 'isams_db',
    user: 'postgres',
    password: '',
    ssl: 'disable',
    maxPool: '20',
    connectionString: 'postgresql://postgres:password@localhost:5432/isams_db'
  });

  const [activeTab, setActiveTab] = useState<'config' | 'schema' | 'code'>('config');
  const [testingStatus, setTestingStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedDdl, setCopiedDdl] = useState(false);

  // Sync connection string when fields change
  const handleFieldChange = (field: string, val: string) => {
    setDbConfig(prev => {
      const next = { ...prev, [field]: val };
      if (field !== 'connectionString') {
        next.connectionString = `postgresql://${next.user || 'postgres'}:${next.password ? '******' : ''}@${next.host || 'localhost'}:${next.port || '5432'}/${next.database || 'isams_db'}`;
      }
      return next;
    });
  };

  const handleTestConnection = async () => {
    setTestingStatus('testing');
    setTestResult(null);

    try {
      const res = await api.testDbConnection(dbConfig);
      if (res.success) {
        setTestingStatus('success');
        setTestResult(res.message);
      } else {
        setTestingStatus('failed');
        setTestResult(res.message);
      }
    } catch (err: any) {
      setTestingStatus('failed');
      setTestResult(err.message || 'Connection test failed. Verify network host and database credentials.');
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.saveDbConfig(dbConfig);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert('Failed to save configuration: ' + err.message);
    }
  };

  const psqlDdlScript = `-- ============================================================
-- ISAMS (Indoor Spatial Asset Management System)
-- Enterprise PostgreSQL DDL Schema Definition
-- Supports Spatial Hierarchy, Asset Lifecycle, AR Room Scans & Audit Trails
-- ============================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(32) NOT NULL UNIQUE,
    address TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(64) NOT NULL DEFAULT 'Staff',
    department VARCHAR(128),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Asset Categories Table
CREATE TABLE IF NOT EXISTS asset_categories (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(32) NOT NULL,
    icon_name VARCHAR(64) DEFAULT 'FileText',
    color VARCHAR(64) DEFAULT 'bg-blue-500',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Spatial Locations Hierarchy Table
CREATE TABLE IF NOT EXISTS locations (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
    parent_id VARCHAR(64) REFERENCES locations(id) ON DELETE SET NULL,
    type VARCHAR(32) NOT NULL CHECK (type IN ('building', 'floor', 'room', 'storage_unit', 'compartment', 'container')),
    code VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    photo_url TEXT,
    capacity INT DEFAULT 100,
    current_occupancy INT DEFAULT 0,
    qr_code VARCHAR(128) NOT NULL UNIQUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Index for hierarchical parent lookups
CREATE INDEX IF NOT EXISTS idx_locations_parent_id ON locations(parent_id);
CREATE INDEX IF NOT EXISTS idx_locations_org_id ON locations(organization_id);

-- 6. Assets Master Table
CREATE TABLE IF NOT EXISTS assets (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
    category_id VARCHAR(64) REFERENCES asset_categories(id) ON DELETE RESTRICT,
    location_id VARCHAR(64) REFERENCES locations(id) ON DELETE RESTRICT,
    asset_number VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    keywords TEXT[],
    barcode VARCHAR(128) UNIQUE,
    qr_code VARCHAR(128) NOT NULL UNIQUE,
    status VARCHAR(32) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'checked_out', 'in_transit', 'maintenance', 'missing')),
    checked_out_to VARCHAR(255),
    checked_out_by_user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    checked_out_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    notes TEXT,
    photos TEXT[],
    documents JSONB DEFAULT '[]'::jsonb,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assets_location_id ON assets(location_id);
CREATE INDEX IF NOT EXISTS idx_assets_category_id ON assets(category_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);

-- 7. Asset Movement Location History Table
CREATE TABLE IF NOT EXISTS asset_location_history (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
    asset_id VARCHAR(64) REFERENCES assets(id) ON DELETE CASCADE,
    asset_number VARCHAR(64) NOT NULL,
    asset_title VARCHAR(255) NOT NULL,
    from_location_id VARCHAR(64),
    from_location_path TEXT,
    to_location_id VARCHAR(64) NOT NULL,
    to_location_path TEXT NOT NULL,
    moved_by_user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    moved_by_user_name VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    moved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Enterprise Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    details TEXT NOT NULL,
    ip_address VARCHAR(45),
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. AR Room Scan Sessions Table
CREATE TABLE IF NOT EXISTS room_scans (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
    room_name VARCHAR(255) NOT NULL,
    location_path TEXT,
    location_id VARCHAR(64) REFERENCES locations(id) ON DELETE SET NULL,
    background_image TEXT,
    paired_device_connected BOOLEAN DEFAULT FALSE,
    paired_device_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. AR Spatial Anchors & Document Pin Annotations Table
CREATE TABLE IF NOT EXISTS ar_spatial_anchors (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    room_scan_id VARCHAR(64) REFERENCES room_scans(id) ON DELETE CASCADE,
    location_id VARCHAR(64) REFERENCES locations(id) ON DELETE SET NULL,
    x FLOAT NOT NULL,
    y FLOAT NOT NULL,
    z_depth FLOAT DEFAULT 1.0,
    title VARCHAR(255) NOT NULL,
    area_type VARCHAR(64) NOT NULL DEFAULT 'shelf',
    color VARCHAR(64) DEFAULT 'bg-blue-500',
    associated_asset_id VARCHAR(64) REFERENCES assets(id) ON DELETE SET NULL,
    documents JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Automated updated_at Trigger Function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
CREATE TRIGGER trg_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
`;

  const copyDdlToClipboard = () => {
    navigator.clipboard.writeText(psqlDdlScript);
    setCopiedDdl(true);
    setTimeout(() => setCopiedDdl(false), 2500);
  };

  const downloadDdlFile = () => {
    const blob = new Blob([psqlDdlScript], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'isams_schema_postgresql.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 text-blue-500 pointer-events-none">
          <Database className="w-64 h-64" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <Database className="w-3.5 h-3.5" />
              <span>Enterprise Integration Hub</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              PostgreSQL Database Integration
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Connect ISAMS to your external PostgreSQL or GCP Cloud SQL database instance.
              Configure parameters, test connection latency, and export complete SQL schema definitions.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/80 backdrop-blur border border-slate-700/60 p-4 rounded-xl">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400 block">Database Mode</span>
              <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                In-Memory DB (PostgreSQL Ready)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('config')}
          className={`pb-3 flex items-center gap-2 transition-colors cursor-pointer border-b-2 ${
            activeTab === 'config'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings2 className="w-4 h-4" />
          Connection Configuration
        </button>

        <button
          onClick={() => setActiveTab('schema')}
          className={`pb-3 flex items-center gap-2 transition-colors cursor-pointer border-b-2 ${
            activeTab === 'schema'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-4 h-4" />
          PostgreSQL DDL Schema Script
        </button>

        <button
          onClick={() => setActiveTab('code')}
          className={`pb-3 flex items-center gap-2 transition-colors cursor-pointer border-b-2 ${
            activeTab === 'code'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-4 h-4" />
          Express & Drizzle ORM Driver Setup
        </button>
      </div>

      {/* TAB 1: CONNECTION CONFIGURATION FORM */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSaveConfig} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-blue-400" />
                  PostgreSQL Host Settings
                </h2>
                {savedSuccess && (
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saved Successfully
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Database Host / IP
                  </label>
                  <input
                    type="text"
                    value={dbConfig.host}
                    onChange={(e) => handleFieldChange('host', e.target.value)}
                    placeholder="e.g. localhost, 10.0.0.5, or postgres.internal"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Port Number
                  </label>
                  <input
                    type="text"
                    value={dbConfig.port}
                    onChange={(e) => handleFieldChange('port', e.target.value)}
                    placeholder="5432"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Database Name
                  </label>
                  <input
                    type="text"
                    value={dbConfig.database}
                    onChange={(e) => handleFieldChange('database', e.target.value)}
                    placeholder="isams_db"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Database User
                  </label>
                  <input
                    type="text"
                    value={dbConfig.user}
                    onChange={(e) => handleFieldChange('user', e.target.value)}
                    placeholder="postgres"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={dbConfig.password}
                    onChange={(e) => handleFieldChange('password', e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    SSL Encryption
                  </label>
                  <select
                    value={dbConfig.ssl}
                    onChange={(e) => handleFieldChange('ssl', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  >
                    <option value="disable">Disable (Local Dev)</option>
                    <option value="require">Require SSL (Cloud SQL / Heroku)</option>
                    <option value="prefer">Prefer SSL</option>
                    <option value="verify-full">Verify Full Certificate</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Formatted Connection String URI
                </label>
                <input
                  type="text"
                  value={dbConfig.connectionString}
                  onChange={(e) => setDbConfig(prev => ({ ...prev, connectionString: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-[11px] text-slate-500 mt-1.5 block">
                  You can paste a full standard PostgreSQL connection string directly or use the individual fields above.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingStatus === 'testing'}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer disabled:opacity-50"
                >
                  {testingStatus === 'testing' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                      Testing Socket...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-400" />
                      Test PostgreSQL Connection
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Save & Apply Config
                </button>
              </div>

              {/* Test Result Indicator */}
              {testingStatus !== 'idle' && (
                <div className={`p-4 rounded-xl border text-xs font-mono flex items-start gap-3 ${
                  testingStatus === 'success' 
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                    : testingStatus === 'failed'
                      ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                      : 'bg-blue-950/40 border-blue-500/40 text-blue-300'
                }`}>
                  {testingStatus === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
                  {testingStatus === 'failed' && <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
                  {testingStatus === 'testing' && <RefreshCw className="w-5 h-5 text-blue-400 shrink-0 animate-spin mt-0.5" />}
                  <div>
                    <span className="font-semibold text-sm block mb-1">
                      {testingStatus === 'success' ? 'Connection Diagnostic Passed' : testingStatus === 'failed' ? 'Connection Diagnostic Notice' : 'Testing Network Connection...'}
                    </span>
                    <p>{testResult}</p>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Side Info Cards */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                Connection Pool Architecture
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                ISAMS uses standard Node.js `pg` pool connections with non-blocking async queries.
              </p>
              <div className="space-y-2 text-xs border-t border-slate-800 pt-3">
                <div className="flex justify-between text-slate-300">
                  <span>Max Connections:</span>
                  <span className="font-mono text-white">20</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Idle Timeout:</span>
                  <span className="font-mono text-white">30,000 ms</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Connect Timeout:</span>
                  <span className="font-mono text-white">5,000 ms</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-blue-400" />
                Quick DDL Schema Download
              </h3>
              <p className="text-xs text-slate-400">
                Download the complete `.sql` script containing all 10 ISAMS enterprise tables and automated timestamp triggers.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={downloadDdlFile}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  .sql File
                </button>
                <button
                  onClick={copyDdlToClipboard}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                >
                  {copiedDdl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedDdl ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: POSTGRESQL DDL SCHEMA */}
      {activeTab === 'schema' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-blue-400" />
                PostgreSQL Tables & Indices DDL Script
              </h2>
              <p className="text-xs text-slate-400">
                Execute this DDL in pgAdmin, psql CLI, or GCP Cloud SQL Query Editor to create the ISAMS database structure.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyDdlToClipboard}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
              >
                {copiedDdl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-blue-400" />}
                {copiedDdl ? 'Copied to Clipboard' : 'Copy SQL Script'}
              </button>
              <button
                onClick={downloadDdlFile}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download .sql
              </button>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-blue-200/90 overflow-x-auto max-h-[550px] scrollbar-thin scrollbar-thumb-slate-800">
            <pre>{psqlDdlScript}</pre>
          </div>
        </div>
      )}

      {/* TAB 3: CODE INTEGRATION EXAMPLE */}
      {activeTab === 'code' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-400" />
              Node.js Express Driver Integration (`pg` & `drizzle-orm`)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Sample backend implementation connecting your Express server directly to PostgreSQL.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-emerald-300/90 overflow-x-auto">
            <pre>{`// src/server/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'isams_db',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
  ssl: process.env.PGSSL === 'require' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed PostgreSQL Query', { text, duration, rows: res.rowCount });
  return res;
}
`}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
