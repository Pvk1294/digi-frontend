
# CRM Reporting Dashboard - Complete Backend Specification

## 🎯 Project Overview
A comprehensive CRM dashboard for managing Facebook Ad accounts with automated reporting, role-based access control, and WhatsApp integration for client communication.

## 🏗️ System Architecture

### Technology Stack Requirements
- **Backend**: Node.js with Express.js or FastAPI (Python)
- **Database**: PostgreSQL with Redis for caching
- **Authentication**: JWT with refresh tokens
- **External APIs**: Facebook Graph API, WhatsApp Business API
- **File Storage**: AWS S3 or Google Cloud Storage
- **Deployment**: Docker containers with nginx reverse proxy

### Core Workflow
1. **Account Sync**: Fetch ad accounts from Facebook Business Manager
2. **Daily Auto Reports**: Generate reports at 00:01 (account timezone)
3. **Manual Report Generation**: On-demand report creation with advanced filters
4. **Report Delivery**: WhatsApp integration with formatted messages
5. **Admin Management**: Multi-factor authentication and security controls

---

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'crm_manager', -- 'crm_manager', 'super_admin'
  
  -- Authentication
  email_verified BOOLEAN DEFAULT false,
  phone VARCHAR(20),
  phone_verified BOOLEAN DEFAULT false,
  
  -- Two-Factor Authentication
  totp_secret VARCHAR(255), -- Google Authenticator secret
  totp_enabled BOOLEAN DEFAULT false,
  backup_codes TEXT[], -- Array of backup codes
  
  -- Account Status
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### Login Sessions & Security
```sql
CREATE TABLE login_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ip_address INET NOT NULL,
  user_agent TEXT,
  location JSONB, -- {"country": "US", "city": "New York", "lat": 40.7128, "lng": -74.0060}
  
  -- Session Status
  is_suspicious BOOLEAN DEFAULT false,
  is_blocked BOOLEAN DEFAULT false,
  logout_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ip_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  description TEXT,
  added_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Alert logs for suspicious activities
CREATE TABLE security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  alert_type VARCHAR(50), -- 'suspicious_login', 'failed_attempts', 'new_device'
  severity VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
  details JSONB,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Business Manager & Tokens
```sql
CREATE TABLE business_managers (
  id VARCHAR(255) PRIMARY KEY, -- Facebook BM ID
  name VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  added_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ad_accounts (
  id VARCHAR(255) PRIMARY KEY, -- Facebook ad account ID
  business_manager_id VARCHAR(255) REFERENCES business_managers(id),
  name VARCHAR(255) NOT NULL,
  account_status VARCHAR(50), -- 'ACTIVE', 'DISABLED', etc.
  currency VARCHAR(10),
  timezone VARCHAR(50),
  
  -- Product Keywords
  product_keywords TEXT[], -- ["OSC", "ABC", "XYZ"]
  keywords_auto_detected BOOLEAN DEFAULT false,
  
  -- Sync Status
  sync_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'syncing', 'ready', 'error'
  last_sync TIMESTAMP,
  sync_error TEXT,
  
  -- Auto Reports
  daily_reports_enabled BOOLEAN DEFAULT true,
  last_daily_report TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ad_accounts_bm ON ad_accounts(business_manager_id);
CREATE INDEX idx_ad_accounts_sync_status ON ad_accounts(sync_status);
```

### Campaigns & Performance Data
```sql
CREATE TABLE campaigns (
  id VARCHAR(255) PRIMARY KEY, -- Facebook campaign ID
  ad_account_id VARCHAR(255) REFERENCES ad_accounts(id),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50),
  objective VARCHAR(100),
  detected_product VARCHAR(100), -- Auto-detected from campaign name
  
  -- Configuration
  daily_budget DECIMAL(10,2),
  lifetime_budget DECIMAL(10,2),
  bid_strategy VARCHAR(100),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Campaign performance metrics cache
CREATE TABLE campaign_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id VARCHAR(255) REFERENCES campaigns(id),
  ad_account_id VARCHAR(255) REFERENCES ad_accounts(id),
  
  -- Date Range
  date_start DATE NOT NULL,
  date_stop DATE NOT NULL,
  
  -- Core Metrics
  spend DECIMAL(10,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  
  -- Calculated Metrics
  cpm DECIMAL(8,2) DEFAULT 0, -- Cost per 1000 impressions
  cpc DECIMAL(8,2) DEFAULT 0, -- Cost per click
  ctr DECIMAL(5,4) DEFAULT 0, -- Click-through rate
  
  -- Lead Metrics
  fb_leads INTEGER DEFAULT 0, -- Facebook lead form submissions
  validated_leads INTEGER DEFAULT 0, -- Validated through external source
  cpl_fb DECIMAL(8,2) DEFAULT 0, -- Cost per FB lead
  cpl_validated DECIMAL(8,2) DEFAULT 0, -- Cost per validated lead
  
  -- Advanced Metrics
  video_views INTEGER DEFAULT 0,
  video_p25_watched INTEGER DEFAULT 0,
  video_p50_watched INTEGER DEFAULT 0,
  video_p75_watched INTEGER DEFAULT 0,
  video_p100_watched INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_campaign_insights_account_date ON campaign_insights(ad_account_id, date_start, date_stop);
CREATE INDEX idx_campaign_insights_campaign ON campaign_insights(campaign_id);
```

### Reports System
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id VARCHAR(255) REFERENCES ad_accounts(id),
  
  -- Report Configuration
  report_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'custom'
  date_start DATE NOT NULL,
  date_stop DATE NOT NULL,
  
  -- Auto-generation
  is_auto_generated BOOLEAN DEFAULT false,
  auto_generated_at TIMESTAMP,
  
  -- Product Analysis
  product_breakdown JSONB, -- Product-wise metrics
  detected_products TEXT[],
  
  -- CRM Comments
  crm_comments JSONB, -- {"product_name": "comment"}
  comments_added_by UUID REFERENCES users(id),
  comments_updated_at TIMESTAMP,
  
  -- File Generation
  pdf_url VARCHAR(500),
  pdf_generated_at TIMESTAMP,
  pdf_size_bytes INTEGER,
  
  -- WhatsApp Integration
  whatsapp_message_template TEXT,
  whatsapp_message_sent BOOLEAN DEFAULT false,
  sent_to_client_at TIMESTAMP,
  sent_by UUID REFERENCES users(id),
  
  -- Status
  generation_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'generating', 'completed', 'failed'
  generation_error TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Report delivery tracking
CREATE TABLE report_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id),
  delivery_method VARCHAR(50), -- 'whatsapp', 'email', 'manual_download'
  client_contact VARCHAR(255), -- Phone/email
  delivery_status VARCHAR(50), -- 'sent', 'delivered', 'read', 'failed'
  delivered_at TIMESTAMP,
  delivery_response JSONB, -- API response from WhatsApp/email service
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Lead Validation & External Data
```sql
-- For validated leads from external sources (Google Sheets, webhooks, etc.)
CREATE TABLE validated_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id VARCHAR(255) REFERENCES campaigns(id),
  ad_account_id VARCHAR(255) REFERENCES ad_accounts(id),
  
  -- Lead Information
  lead_id VARCHAR(255), -- External lead ID
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  
  -- Validation Status
  is_validated BOOLEAN DEFAULT true,
  validation_source VARCHAR(100), -- 'google_sheets', 'webhook', 'manual'
  validation_date DATE,
  
  -- Lead Quality
  quality_score INTEGER, -- 1-10 scale
  conversion_status VARCHAR(50), -- 'qualified', 'not_qualified', 'pending'
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Account prepaid balance tracking
CREATE TABLE account_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id VARCHAR(255) REFERENCES ad_accounts(id),
  balance_amount DECIMAL(10,2),
  currency VARCHAR(10),
  last_updated TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(ad_account_id)
);
```

---

## 🔌 API Endpoints Specification

### Authentication Endpoints

#### 1. Standard Login
```http
POST /api/auth/login
Content-Type: application/json

Request:
{
  "email": "manager@company.com",
  "password": "securePassword123",
  "ip_address": "192.168.1.100", // Auto-detected or provided
  "user_agent": "Mozilla/5.0..." // Browser info
}

Response:
{
  "success": true,
  "access_token": "jwt_access_token",
  "refresh_token": "jwt_refresh_token",
  "user": {
    "id": "uuid",
    "email": "manager@company.com",
    "name": "John Doe",
    "role": "crm_manager",
    "totp_enabled": false
  },
  "requires_2fa": false
}

Error Response (429 - Rate Limited):
{
  "success": false,
  "error": "too_many_attempts",
  "message": "Too many login attempts. Account locked for 30 minutes.",
  "locked_until": "2025-06-10T15:30:00Z"
}
```

#### 2. Super Admin Three-Factor Authentication
```http
POST /api/auth/admin-login
Content-Type: application/json

Request:
{
  "email": "admin@company.com",
  "password": "adminPassword123",
  "otp_code": "123456", // Email/SMS OTP
  "totp_code": "789012", // Google Authenticator
  "ip_address": "192.168.1.100"
}

Response:
{
  "success": true,
  "access_token": "jwt_access_token",
  "refresh_token": "jwt_refresh_token",
  "user": {
    "id": "uuid",
    "email": "admin@company.com",
    "role": "super_admin"
  },
  "session_id": "session_uuid"
}
```

#### 3. IP Whitelist Check
```http
GET /api/auth/check-ip/{ip_address}

Response:
{
  "success": true,
  "is_whitelisted": true,
  "requires_approval": false
}
```

### Ad Account Management

#### 4. Sync Ad Accounts from Business Manager
```http
POST /api/facebook/sync-accounts
Authorization: Bearer {access_token}

Request:
{
  "business_manager_id": "123456789", // Optional, if multiple BMs
  "force_resync": false
}

Response:
{
  "success": true,
  "message": "Sync initiated for 5 ad accounts",
  "sync_job_id": "job_uuid",
  "estimated_duration": "3-5 minutes",
  "accounts_found": 5,
  "accounts": [
    {
      "id": "act_1234567890",
      "name": "XYZ Company - Main Account",
      "status": "syncing",
      "timezone": "America/New_York",
      "currency": "USD"
    }
  ]
}

Error Response:
{
  "success": false,
  "error": "facebook_api_error",
  "message": "Invalid access token or insufficient permissions",
  "facebook_error": {
    "code": 190,
    "message": "Invalid OAuth access token."
  }
}
```

#### 5. Get Sync Status
```http
GET /api/facebook/sync-status/{job_id}
Authorization: Bearer {access_token}

Response:
{
  "success": true,
  "status": "in_progress", // 'pending', 'in_progress', 'completed', 'failed'
  "progress": 60, // Percentage
  "accounts_processed": 3,
  "total_accounts": 5,
  "current_account": "act_1234567890",
  "estimated_time_remaining": "2 minutes"
}
```

#### 6. Get Ad Accounts List
```http
GET /api/ad-accounts
Authorization: Bearer {access_token}

Query Parameters:
- status: 'ready', 'syncing', 'error'
- search: Search by account name
- limit: 50 (default)
- offset: 0

Response:
{
  "success": true,
  "accounts": [
    {
      "id": "act_1234567890",
      "name": "XYZ Company - Main Account",
      "status": "ready",
      "currency": "USD",
      "timezone": "America/New_York",
      "last_sync": "2025-06-10T08:00:00Z",
      "daily_reports_enabled": true,
      "last_daily_report": "2025-06-10T00:01:00Z",
      "product_keywords": ["OSC", "ABC", "XYZ"],
      "campaigns_count": 15,
      "active_campaigns": 12
    }
  ],
  "total": 10,
  "has_next": true
}
```

### Campaign & Keywords Management

#### 7. Auto-Detect Product Keywords
```http
POST /api/campaigns/detect-keywords
Authorization: Bearer {access_token}

Request:
{
  "ad_account_id": "act_1234567890",
  "min_occurrences": 2 // Minimum times keyword appears
}

Response:
{
  "success": true,
  "detected_keywords": ["OSC", "ABC", "DEF"],
  "confidence_score": 85, // Percentage
  "campaign_analysis": [
    {
      "campaign_name": "OSC-May-Launch-Retargeting",
      "detected_product": "OSC",
      "confidence": 90
    }
  ],
  "suggestions": [
    {
      "keyword": "OSC",
      "frequency": 8,
      "campaigns": ["OSC-May-Launch", "OSC-Retargeting"]
    }
  ]
}
```

#### 8. Update Product Keywords
```http
PUT /api/ad-accounts/{account_id}/keywords
Authorization: Bearer {access_token}

Request:
{
  "product_keywords": ["OSC", "ABC", "XYZ"],
  "auto_detected": false
}

Response:
{
  "success": true,
  "message": "Product keywords updated successfully",
  "keywords": ["OSC", "ABC", "XYZ"],
  "campaigns_affected": 12
}
```

### Daily Reports System

#### 9. Get Daily Reports
```http
GET /api/reports/daily
Authorization: Bearer {access_token}

Query Parameters:
- date: '2025-06-10' (default: yesterday)
- ad_account_id: 'act_1234567890' (optional filter)
- auto_generated: true/false (optional filter)

Response:
{
  "success": true,
  "reports": [
    {
      "id": "report_uuid",
      "ad_account_id": "act_1234567890",
      "client_name": "XYZ Company",
      "date_range": {
        "start": "2025-06-09T00:00:00Z",
        "stop": "2025-06-09T23:59:59Z"
      },
      "is_auto_generated": true,
      "auto_generated_at": "2025-06-10T00:01:00Z",
      "status": "completed",
      "product_metrics": [
        {
          "product_name": "OSC",
          "spend": 1250.50,
          "fb_leads": 45,
          "validated_leads": 38,
          "cpl_validated": 32.91,
          "cpm": 15.25,
          "ctr": 2.1,
          "impressions": 82000,
          "clicks": 1722
        }
      ],
      "prepaid_balance": 15750.00,
      "whatsapp_message": "Hi XYZ Company, here is your daily report...",
      "pdf_url": "https://storage.com/reports/daily_report_uuid.pdf"
    }
  ]
}
```

#### 10. Generate WhatsApp Message for Daily Report
```http
POST /api/reports/{report_id}/whatsapp-message
Authorization: Bearer {access_token}

Response:
{
  "success": true,
  "message": "Hi XYZ Company, here is your daily report for June 9, 2025:\n\n• OSC: Spend: $1,250.50, Leads: 38, CPL: $32.91\n• ABC: Spend: $890.25, Leads: 25, CPL: $35.61\n\nRemaining prepaid balance: $15,750.00\n\nPlease find the detailed report attached. Thank you!",
  "formatted_for_whatsapp": true,
  "character_count": 245
}
```

### Manual Report Generation

#### 11. Generate Custom Report
```http
POST /api/reports/generate
Authorization: Bearer {access_token}

Request:
{
  "ad_account_id": "act_1234567890",
  "date_range": {
    "start": "2025-06-01",
    "end": "2025-06-07"
  },
  "report_type": "weekly", // 'daily', 'weekly', 'monthly', 'custom'
  "include_products": ["OSC", "ABC"], // Optional filter
  "include_charts": true,
  "include_insights": true
}

Response:
{
  "success": true,
  "report_id": "report_uuid",
  "status": "generating",
  "estimated_completion": "2025-06-10T10:35:00Z",
  "message": "Report generation started. This may take up to 30 minutes."
}
```

#### 12. Get Report Generation Status
```http
GET /api/reports/{report_id}/status
Authorization: Bearer {access_token}

Response:
{
  "success": true,
  "report_id": "report_uuid",
  "status": "generating", // 'pending', 'generating', 'completed', 'failed'
  "progress": 75,
  "current_step": "Generating charts and insights",
  "estimated_completion": "2025-06-10T10:35:00Z",
  "steps_completed": [
    "Fetching campaign data",
    "Calculating product metrics",
    "Validating lead data"
  ],
  "error": null
}
```

#### 13. Get Generated Report
```http
GET /api/reports/{report_id}
Authorization: Bearer {access_token}

Response:
{
  "success": true,
  "report": {
    "id": "report_uuid",
    "ad_account_id": "act_1234567890",
    "client_name": "XYZ Company",
    "report_type": "weekly",
    "date_range": {
      "start": "2025-06-01T00:00:00Z",
      "stop": "2025-06-07T23:59:59Z"
    },
    "product_metrics": [
      {
        "product_name": "OSC",
        "campaigns_count": 5,
        "spend": 8750.25,
        "fb_leads": 315,
        "validated_leads": 267,
        "cpl_fb": 27.78,
        "cpl_validated": 32.77,
        "cpm": 14.20,
        "ctr": 2.3,
        "impressions": 615789,
        "clicks": 14163,
        "conversion_rate": 84.76, // validated/fb leads
        "daily_breakdown": [
          {
            "date": "2025-06-01",
            "spend": 1250.50,
            "leads": 45,
            "cpl": 27.79
          }
        ]
      }
    ],
    "summary": {
      "total_spend": 15420.75,
      "total_fb_leads": 542,
      "total_validated_leads": 459,
      "overall_cpl": 33.61,
      "avg_cpm": 13.85,
      "avg_ctr": 2.1,
      "conversion_rate": 84.69
    },
    "insights": [
      {
        "type": "performance",
        "title": "OSC Product Performance",
        "description": "OSC campaigns showed 15% improvement in CPL compared to previous week",
        "recommendation": "Consider increasing budget for OSC campaigns"
      }
    ],
    "charts": {
      "spend_trend": "data:image/png;base64,iVBOR...",
      "leads_by_product": "data:image/png;base64,iVBOR...",
      "cpl_comparison": "data:image/png;base64,iVBOR..."
    },
    "pdf_url": "https://storage.com/reports/weekly_report_uuid.pdf",
    "created_at": "2025-06-10T10:30:00Z"
  }
}
```

### Report Comments & Delivery

#### 14. Add/Update Report Comments
```http
PUT /api/reports/{report_id}/comments
Authorization: Bearer {access_token}

Request:
{
  "comments": {
    "OSC": "Performance improved after creative refresh on June 3rd",
    "ABC": "New targeting strategy showing promising results",
    "XYZ": "Consider pausing underperforming ad sets"
  }
}

Response:
{
  "success": true,
  "message": "Comments updated successfully",
  "updated_at": "2025-06-10T11:00:00Z"
}
```

#### 15. Generate PDF Report
```http
POST /api/reports/{report_id}/generate-pdf
Authorization: Bearer {access_token}

Request:
{
  "include_watermark": true,
  "include_charts": true,
  "include_comments": true
}

Response:
{
  "success": true,
  "pdf_url": "https://storage.com/reports/report_uuid.pdf",
  "file_size": 2048576, // bytes
  "generated_at": "2025-06-10T11:05:00Z"
}
```

#### 16. Send Report via WhatsApp
```http
POST /api/reports/{report_id}/send-whatsapp
Authorization: Bearer {access_token}

Request:
{
  "phone_number": "+1234567890",
  "custom_message": "Hi John, here's your weekly performance report...",
  "include_pdf": true
}

Response:
{
  "success": true,
  "message_id": "whatsapp_msg_id",
  "delivery_status": "sent",
  "sent_at": "2025-06-10T11:10:00Z",
  "delivery_id": "delivery_uuid"
}
```

### Admin Panel Endpoints

#### 17. Manage Business Manager Tokens
```http
GET /api/admin/business-managers
Authorization: Bearer {super_admin_token}

Response:
{
  "success": true,
  "business_managers": [
    {
      "id": "123456789",
      "name": "Main Business Manager",
      "token_status": "active", // 'active', 'expired', 'invalid'
      "token_expires_at": "2025-12-31T23:59:59Z",
      "ad_accounts_count": 15,
      "last_sync": "2025-06-10T08:00:00Z",
      "added_by": "admin@company.com",
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}

POST /api/admin/business-managers
Authorization: Bearer {super_admin_token}

Request:
{
  "business_manager_id": "987654321",
  "name": "Secondary Business Manager",
  "access_token": "EAAB...very_long_token"
}

Response:
{
  "success": true,
  "message": "Business Manager added successfully",
  "business_manager": {
    "id": "987654321",
    "name": "Secondary Business Manager",
    "token_status": "active"
  }
}
```

#### 18. IP Whitelist Management
```http
GET /api/admin/ip-whitelist
Authorization: Bearer {super_admin_token}

Response:
{
  "success": true,
  "whitelisted_ips": [
    {
      "id": "uuid",
      "ip_address": "192.168.1.100",
      "description": "Office Main IP",
      "added_by": "admin@company.com",
      "is_active": true,
      "created_at": "2025-06-01T10:00:00Z"
    }
  ]
}

POST /api/admin/ip-whitelist
Authorization: Bearer {super_admin_token}

Request:
{
  "ip_address": "203.45.67.89",
  "description": "Remote Office Location"
}

Response:
{
  "success": true,
  "message": "IP address added to whitelist",
  "whitelist_entry": {
    "id": "uuid",
    "ip_address": "203.45.67.89",
    "description": "Remote Office Location"
  }
}
```

#### 19. Security & Login Activity
```http
GET /api/admin/login-activity
Authorization: Bearer {super_admin_token}

Query Parameters:
- days: 30 (default)
- user_id: Filter by specific user
- suspicious_only: true/false
- limit: 100

Response:
{
  "success": true,
  "login_sessions": [
    {
      "id": "session_uuid",
      "user": {
        "id": "user_uuid",
        "email": "manager@company.com",
        "name": "John Doe"
      },
      "ip_address": "192.168.1.100",
      "location": {
        "country": "United States",
        "city": "New York",
        "latitude": 40.7128,
        "longitude": -74.0060
      },
      "user_agent": "Mozilla/5.0...",
      "is_suspicious": false,
      "created_at": "2025-06-10T09:30:00Z",
      "logout_at": null
    }
  ],
  "total": 156,
  "suspicious_count": 3
}
```

#### 20. Security Alerts
```http
GET /api/admin/security-alerts
Authorization: Bearer {super_admin_token}

Response:
{
  "success": true,
  "alerts": [
    {
      "id": "alert_uuid",
      "user": {
        "id": "user_uuid",
        "email": "manager@company.com"
      },
      "alert_type": "suspicious_login",
      "severity": "medium",
      "details": {
        "ip_address": "203.45.67.89",
        "location": "Unknown",
        "reason": "Login from new location"
      },
      "resolved": false,
      "created_at": "2025-06-10T09:45:00Z"
    }
  ]
}

POST /api/admin/security-alerts/{alert_id}/resolve
Authorization: Bearer {super_admin_token}

Response:
{
  "success": true,
  "message": "Alert marked as resolved"
}
```

---

## 🔗 External API Integrations

### Facebook Graph API Integration

#### Required Permissions
- `ads_read` - Read ad account data
- `ads_management` - Access comprehensive ad insights
- `business_management` - Access Business Manager data

#### Rate Limiting Strategy
```javascript
const FACEBOOK_API_CONFIG = {
  maxCallsPerHour: 200,
  callsPerMinute: 25,
  burstLimit: 50,
  retryAttempts: 3,
  exponentialBackoffBase: 2000, // Start with 2 second delay
  maxRetryDelay: 300000 // Max 5 minutes
};

// Rate limiter implementation
class FacebookAPIRateLimiter {
  constructor() {
    this.callHistory = [];
    this.isThrottled = false;
  }
  
  async makeCall(endpoint, params) {
    await this.checkRateLimit();
    
    for (let attempt = 1; attempt <= FACEBOOK_API_CONFIG.retryAttempts; attempt++) {
      try {
        const response = await this.executeCall(endpoint, params);
        this.recordCall();
        return response;
        
      } catch (error) {
        if (error.code === 4 || error.code === 17) { // Rate limit errors
          const delay = this.calculateBackoffDelay(attempt);
          await this.sleep(delay);
          continue;
        }
        throw error;
      }
    }
    throw new Error('Max retry attempts exceeded');
  }
  
  calculateBackoffDelay(attempt) {
    return Math.min(
      FACEBOOK_API_CONFIG.exponentialBackoffBase * Math.pow(2, attempt - 1),
      FACEBOOK_API_CONFIG.maxRetryDelay
    );
  }
}
```

#### Key API Endpoints

##### Fetch Business Manager Ad Accounts
```javascript
// GET /{business-manager-id}/owned_ad_accounts
const fetchAdAccounts = async (businessManagerId, accessToken) => {
  const url = `https://graph.facebook.com/v18.0/${businessManagerId}/owned_ad_accounts`;
  const params = {
    fields: 'id,name,account_status,currency,timezone,business,created_time',
    access_token: accessToken,
    limit: 100
  };
  
  return await rateLimiter.makeCall(url, params);
};
```

##### Fetch Campaign Data
```javascript
// GET /{ad-account-id}/campaigns
const fetchCampaigns = async (adAccountId, accessToken) => {
  const url = `https://graph.facebook.com/v18.0/${adAccountId}/campaigns`;
  const params = {
    fields: 'id,name,status,objective,created_time,start_time,stop_time,daily_budget,lifetime_budget',
    access_token: accessToken,
    limit: 100
  };
  
  return await rateLimiter.makeCall(url, params);
};
```

##### Fetch Insights Data
```javascript
// GET /{ad-account-id}/insights
const fetchInsights = async (adAccountId, dateRange, accessToken) => {
  const url = `https://graph.facebook.com/v18.0/${adAccountId}/insights`;
  const params = {
    time_range: JSON.stringify(dateRange),
    fields: 'spend,impressions,clicks,reach,actions,cost_per_action_type,cpm,cpc,ctr',
    breakdowns: 'campaign_id',
    level: 'campaign',
    access_token: accessToken,
    limit: 100
  };
  
  return await rateLimiter.makeCall(url, params);
};
```

### WhatsApp Business API Integration

#### Send Message with PDF Attachment
```javascript
const sendWhatsAppReport = async (phoneNumber, message, pdfUrl) => {
  const whatsappConfig = {
    baseUrl: 'https://graph.facebook.com/v18.0',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN
  };
  
  // Send text message first
  const textResponse = await axios.post(
    `${whatsappConfig.baseUrl}/${whatsappConfig.phoneNumberId}/messages`,
    {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: { body: message }
    },
    {
      headers: {
        'Authorization': `Bearer ${whatsappConfig.accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  // Send PDF document
  if (pdfUrl) {
    const documentResponse = await axios.post(
      `${whatsappConfig.baseUrl}/${whatsappConfig.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'document',
        document: {
          link: pdfUrl,
          filename: 'performance_report.pdf'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${whatsappConfig.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
  }
  
  return {
    textMessageId: textResponse.data.messages[0].id,
    documentMessageId: documentResponse?.data.messages[0].id
  };
};
```

### Google Sheets Integration (Lead Validation)
```javascript
const { GoogleSpreadsheet } = require('google-spreadsheet');

class LeadValidationService {
  constructor() {
    this.doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);
  }
  
  async authenticate() {
    await this.doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
    await this.doc.loadInfo();
  }
  
  async fetchValidatedLeads(campaignIds, dateRange) {
    const sheet = this.doc.sheetsByIndex[0]; // First sheet
    const rows = await sheet.getRows();
    
    return rows.filter(row => {
      const leadDate = new Date(row.date);
      const isInDateRange = leadDate >= new Date(dateRange.start) && 
                           leadDate <= new Date(dateRange.end);
      const isCampaignMatch = campaignIds.some(id => 
        row.campaign_id === id || row.campaign_name?.includes(id)
      );
      
      return isInDateRange && isCampaignMatch && row.validated === 'true';
    }).map(row => ({
      leadId: row.lead_id,
      campaignId: row.campaign_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      validationDate: row.date,
      qualityScore: parseInt(row.quality_score) || 5
    }));
  }
}
```

---

## 🏗️ Backend Implementation Requirements

### 1. Product Keywords Detection Algorithm
```python
import re
from collections import Counter
from typing import List, Dict

class ProductKeywordDetector:
    def __init__(self):
        self.ignore_words = {
            'lookalike', 'retarget', 'remarketing', 'broad', 'retargeting',
            'repurchase', 'tof', 'bof', 'top', 'funnel', 'middle', 'mof',
            'roas', 'awareness', 'conversion', 'campaign', 'ad', 'test',
            'new', 'old', 'copy', 'creative', 'audience', 'interest',
            'cold', 'warm', 'hot', 'video', 'image', 'carousel'
        }
    
    def detect_keywords(self, campaign_names: List[str], min_occurrences: int = 2) -> Dict:
        keyword_candidates = Counter()
        campaign_mappings = {}
        
        for campaign_name in campaign_names:
            # Split by common delimiters
            parts = re.split(r'[-_\s|+.]+', campaign_name)
            
            for part in parts:
                word = part.lower().strip()
                
                # Keyword validation criteria
                if (2 <= len(word) <= 8 and  # Reasonable length
                    word not in self.ignore_words and  # Not a generic term
                    re.match(r'^[a-z0-9]+$', word) and  # Alphanumeric only
                    not word.isdigit()):  # Not purely numeric
                    
                    keyword = word.upper()
                    keyword_candidates[keyword] += 1
                    
                    # Track which campaigns contain this keyword
                    if keyword not in campaign_mappings:
                        campaign_mappings[keyword] = []
                    campaign_mappings[keyword].append(campaign_name)
        
        # Filter keywords that appear in minimum number of campaigns
        detected_keywords = [
            keyword for keyword, count in keyword_candidates.items()
            if count >= min_occurrences
        ]
        
        # Calculate confidence score
        total_campaigns = len(campaign_names)
        confidence = (sum(keyword_candidates[k] for k in detected_keywords) / 
                     (total_campaigns * len(detected_keywords))) * 100 if detected_keywords else 0
        
        return {
            'keywords': detected_keywords[:10],  # Limit to top 10
            'confidence_score': min(confidence, 100),
            'campaign_mappings': {k: campaign_mappings[k] for k in detected_keywords},
            'analysis': [
                {
                    'keyword': keyword,
                    'frequency': keyword_candidates[keyword],
                    'campaigns': campaign_mappings[keyword]
                }
                for keyword in detected_keywords
            ]
        }
```

### 2. Daily Report Auto-Generation Service
```python
import asyncio
from datetime import datetime, timedelta
import pytz
from apscheduler.schedulers.asyncio import AsyncIOScheduler

class DailyReportScheduler:
    def __init__(self, report_generator, db_session):
        self.scheduler = AsyncIOScheduler()
        self.report_generator = report_generator
        self.db = db_session
        
    async def start(self):
        # Schedule daily report generation for all active accounts
        self.scheduler.add_job(
            self.generate_all_daily_reports,
            'cron',
            hour=0,
            minute=1,  # 00:01
            timezone='UTC'
        )
        self.scheduler.start()
    
    async def generate_all_daily_reports(self):
        """Generate daily reports for all active ad accounts"""
        active_accounts = await self.db.fetch_all(
            "SELECT id, timezone, name FROM ad_accounts WHERE daily_reports_enabled = true"
        )
        
        for account in active_accounts:
            try:
                # Calculate date range in account's timezone
                account_tz = pytz.timezone(account['timezone'])
                now = datetime.now(account_tz)
                yesterday_start = (now - timedelta(days=1)).replace(
                    hour=0, minute=0, second=0, microsecond=0
                )
                yesterday_end = yesterday_start.replace(
                    hour=23, minute=59, second=59, microsecond=999999
                )
                
                # Generate report
                report_data = await self.report_generator.generate_daily_report(
                    ad_account_id=account['id'],
                    date_start=yesterday_start.date(),
                    date_end=yesterday_end.date(),
                    is_auto_generated=True
                )
                
                print(f"Generated daily report for {account['name']}: {report_data['id']}")
                
            except Exception as e:
                print(f"Failed to generate daily report for {account['name']}: {str(e)}")
                # Log error to database
                await self.log_generation_error(account['id'], str(e))
    
    async def log_generation_error(self, account_id: str, error: str):
        await self.db.execute(
            """INSERT INTO report_generation_errors 
               (ad_account_id, error_message, created_at) 
               VALUES (?, ?, ?)""",
            [account_id, error, datetime.utcnow()]
        )
```

### 3. PDF Generation Service
```python
from weasyprint import HTML, CSS
from jinja2 import Template
import boto3
from io import BytesIO

class PDFReportGenerator:
    def __init__(self, s3_client, bucket_name):
        self.s3 = s3_client
        self.bucket = bucket_name
        self.template = Template(self.get_html_template())
    
    async def generate_report_pdf(self, report_data: dict) -> str:
        """Generate PDF from report data and upload to S3"""
        
        # Render HTML from template
        html_content = self.template.render(
            client_name=report_data['client_name'],
            report_period=report_data['report_period'],
            product_metrics=report_data['product_metrics'],
            summary=report_data.get('summary', {}),
            charts=report_data.get('charts', {}),
            watermark_text="Generated by DigitalInclined | Internal CRM Report"
        )
        
        # Generate PDF
        pdf_buffer = BytesIO()
        HTML(string=html_content).write_pdf(
            pdf_buffer,
            stylesheets=[CSS(string=self.get_css_styles())]
        )
        
        # Upload to S3
        pdf_filename = f"reports/{report_data['id']}.pdf"
        self.s3.upload_fileobj(
            pdf_buffer,
            self.bucket,
            pdf_filename,
            ExtraArgs={'ContentType': 'application/pdf'}
        )
        
        # Return public URL
        return f"https://{self.bucket}.s3.amazonaws.com/{pdf_filename}"
    
    def get_html_template(self) -> str:
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Performance Report - {{ client_name }}</title>
        </head>
        <body>
            <div class="watermark">{{ watermark_text }}</div>
            
            <header>
                <h1>Performance Report</h1>
                <div class="report-info">
                    <p><strong>Client:</strong> {{ client_name }}</p>
                    <p><strong>Period:</strong> {{ report_period }}</p>
                    <p><strong>Generated:</strong> {{ now().strftime('%B %d, %Y at %I:%M %p') }}</p>
                </div>
            </header>
            
            <!-- Summary Section -->
            {% if summary %}
            <section class="summary">
                <h2>📊 Summary Overview</h2>
                <div class="metrics-grid">
                    <div class="metric">
                        <span class="label">Total Spend</span>
                        <span class="value">${{ summary.total_spend | round(2) }}</span>
                    </div>
                    <div class="metric">
                        <span class="label">Total Leads</span>
                        <span class="value">{{ summary.total_validated_leads }}</span>
                    </div>
                    <div class="metric">
                        <span class="label">Average CPL</span>
                        <span class="value">${{ summary.avg_cpl | round(2) }}</span>
                    </div>
                </div>
            </section>
            {% endif %}
            
            <!-- Product Performance -->
            <section class="products">
                <h2>📦 Product Performance Breakdown</h2>
                {% for product in product_metrics %}
                <div class="product-section">
                    <h3>{{ product.product_name }}</h3>
                    <div class="metrics-table">
                        <table>
                            <tr><td>Spend:</td><td>${{ product.spend | round(2) }}</td></tr>
                            <tr><td>FB Leads:</td><td>{{ product.fb_leads }}</td></tr>
                            <tr><td>Validated Leads:</td><td>{{ product.validated_leads }}</td></tr>
                            <tr><td>CPL (Validated):</td><td>${{ product.cpl_validated | round(2) }}</td></tr>
                            <tr><td>CPM:</td><td>${{ product.cpm | round(2) }}</td></tr>
                            <tr><td>CTR:</td><td>{{ product.ctr | round(2) }}%</td></tr>
                        </table>
                    </div>
                    
                    {% if product.comments %}
                    <div class="comments">
                        <h4>📝 Comments & Insights</h4>
                        <p>{{ product.comments }}</p>
                    </div>
                    {% endif %}
                </div>
                {% endfor %}
            </section>
            
            <!-- Charts Section -->
            {% if charts %}
            <section class="charts">
                <h2>📈 Performance Charts</h2>
                {% for chart_name, chart_data in charts.items() %}
                <div class="chart">
                    <h3>{{ chart_name | title }}</h3>
                    <img src="{{ chart_data }}" alt="{{ chart_name }} Chart" />
                </div>
                {% endfor %}
            </section>
            {% endif %}
        </body>
        </html>
        """
    
    def get_css_styles(self) -> str:
        return """
        @page {
            size: A4;
            margin: 20mm;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
        }
        
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 60px;
            color: rgba(0,0,0,0.05);
            z-index: -1;
            white-space: nowrap;
        }
        
        header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
        }
        
        h1 {
            color: #3b82f6;
            margin-bottom: 10px;
        }
        
        .product-section {
            border: 1px solid #e5e7eb;
            margin: 20px 0;
            padding: 20px;
            border-radius: 8px;
            background: #f9fafb;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin: 20px 0;
        }
        
        .metric {
            text-align: center;
            padding: 15px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .metric .label {
            display: block;
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 5px;
        }
        
        .metric .value {
            display: block;
            font-size: 24px;
            font-weight: bold;
            color: #3b82f6;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        
        td {
            padding: 8px 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        td:first-child {
            font-weight: bold;
            color: #374151;
        }
        
        .comments {
            margin-top: 15px;
            padding: 15px;
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            border-radius: 0 4px 4px 0;
        }
        
        .chart {
            margin: 20px 0;
            text-align: center;
        }
        
        .chart img {
            max-width: 100%;
            height: auto;
        }
        """
```

### 4. Authentication & Security Service
```python
import jwt
import pyotp
import bcrypt
from datetime import datetime, timedelta
import geoip2.database

class AuthenticationService:
    def __init__(self, db_session, jwt_secret, geoip_db_path):
        self.db = db_session
        self.jwt_secret = jwt_secret
        self.geoip_reader = geoip2.database.Reader(geoip_db_path)
        
    async def authenticate_user(self, email: str, password: str, ip_address: str, user_agent: str) -> dict:
        """Authenticate user with comprehensive security checks"""
        
        # Get user from database
        user = await self.db.fetch_one(
            "SELECT * FROM users WHERE email = ? AND is_active = true",
            [email]
        )
        
        if not user:
            await self.log_failed_attempt(email, ip_address, "user_not_found")
            raise AuthenticationError("Invalid credentials")
        
        # Check if account is locked
        if user['locked_until'] and user['locked_until'] > datetime.utcnow():
            raise AuthenticationError("Account temporarily locked")
        
        # Verify password
        if not bcrypt.checkpw(password.encode(), user['password_hash'].encode()):
            await self.increment_failed_attempts(user['id'])
            await self.log_failed_attempt(email, ip_address, "invalid_password")
            raise AuthenticationError("Invalid credentials")
        
        # Check IP whitelist for super admins
        if user['role'] == 'super_admin':
            is_whitelisted = await self.check_ip_whitelist(ip_address)
            if not is_whitelisted:
                await self.create_security_alert(
                    user['id'], 
                    'unauthorized_ip', 
                    {'ip_address': ip_address}
                )
                raise AuthenticationError("Access denied from this IP address")
        
        # Get location info
        location = self.get_ip_location(ip_address)
        
        # Check for suspicious login
        is_suspicious = await self.detect_suspicious_login(user['id'], ip_address, location)
        
        # Create login session
        session_id = await self.create_login_session(
            user['id'], ip_address, user_agent, location, is_suspicious
        )
        
        # Generate tokens
        access_token = self.generate_access_token(user)
        refresh_token = self.generate_refresh_token(user['id'], session_id)
        
        # Reset failed attempts
        await self.reset_failed_attempts(user['id'])
        
        # Update last login
        await self.db.execute(
            "UPDATE users SET last_login = ? WHERE id = ?",
            [datetime.utcnow(), user['id']]
        )
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'name': user['name'],
                'role': user['role'],
                'totp_enabled': user['totp_enabled']
            },
            'requires_2fa': user['totp_enabled'],
            'session_id': session_id,
            'is_suspicious': is_suspicious
        }
    
    async def verify_totp(self, user_id: str, totp_code: str) -> bool:
        """Verify Google Authenticator TOTP code"""
        user = await self.db.fetch_one(
            "SELECT totp_secret FROM users WHERE id = ? AND totp_enabled = true",
            [user_id]
        )
        
        if not user or not user['totp_secret']:
            return False
        
        totp = pyotp.TOTP(user['totp_secret'])
        return totp.verify(totp_code, valid_window=1)  # 30-second window
    
    def get_ip_location(self, ip_address: str) -> dict:
        """Get geographic location from IP address"""
        try:
            response = self.geoip_reader.city(ip_address)
            return {
                'country': response.country.name,
                'city': response.city.name,
                'latitude': float(response.location.latitude) if response.location.latitude else None,
                'longitude': float(response.location.longitude) if response.location.longitude else None
            }
        except:
            return {'country': 'Unknown', 'city': 'Unknown'}
    
    async def detect_suspicious_login(self, user_id: str, ip_address: str, location: dict) -> bool:
        """Detect suspicious login patterns"""
        # Get recent login locations
        recent_logins = await self.db.fetch_all(
            """SELECT ip_address, location FROM login_sessions 
               WHERE user_id = ? AND created_at > ? 
               ORDER BY created_at DESC LIMIT 10""",
            [user_id, datetime.utcnow() - timedelta(days=30)]
        )
        
        if not recent_logins:
            return False  # First login
        
        # Check for new location
        for login in recent_logins:
            if login['location']:
                prev_location = login['location']
                if (prev_location.get('country') == location.get('country') and
                    prev_location.get('city') == location.get('city')):
                    return False  # Same location as before
        
        # Check for impossible travel (different countries within short time)
        last_login = recent_logins[0]
        if last_login['created_at'] > datetime.utcnow() - timedelta(hours=2):
            if (last_login['location'] and 
                last_login['location'].get('country') != location.get('country')):
                return True  # Different country within 2 hours
        
        return True  # New location
```

---

## 🚀 Deployment & Infrastructure

### Docker Configuration
```dockerfile
# Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    libpq-dev \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose for Development
```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/crm_reports
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-super-secret-jwt-key
      - FACEBOOK_APP_ID=your_facebook_app_id
      - FACEBOOK_APP_SECRET=your_facebook_app_secret
    depends_on:
      - postgres
      - redis
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=crm_reports
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
```

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/crm_reports
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-256-bits
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30

# Facebook API
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_API_VERSION=v18.0

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token

# AWS S3 (File Storage)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=your-reports-bucket
AWS_REGION=us-east-1

# Google Sheets (Lead Validation)
GOOGLE_SERVICE_EMAIL=your-service@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your_google_sheet_id

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@company.com
SMTP_PASSWORD=your_app_password
SMTP_FROM_EMAIL=noreply@company.com

# Security
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
RATE_LIMIT_PER_MINUTE=60
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_DURATION_MINUTES=30

# GeoIP Database
GEOIP_DATABASE_PATH=/app/data/GeoLite2-City.mmdb

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json
SENTRY_DSN=your_sentry_dsn_for_error_tracking
```

---

## 🔒 Security Implementation

### API Rate Limiting
```python
from fastapi import HTTPException, Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)

# Different rate limits for different endpoints
@app.post("/api/auth/login")
@limiter.limit("5/minute")  # 5 login attempts per minute
async def login(request: Request, credentials: LoginCredentials):
    # Login logic
    pass

@app.get("/api/ad-accounts")
@limiter.limit("100/minute")  # 100 requests per minute for data endpoints
async def get_ad_accounts(request: Request):
    # Data fetching logic
    pass

@app.post("/api/reports/generate")
@limiter.limit("10/hour")  # 10 report generations per hour
async def generate_report(request: Request):
    # Report generation logic
    pass
```

### Input Validation & Sanitization
```python
from pydantic import BaseModel, validator, EmailStr
from typing import Optional, List
import re

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v

class ReportGenerationRequest(BaseModel):
    ad_account_id: str
    date_range: DateRange
    report_type: str
    include_products: Optional[List[str]] = []
    
    @validator('ad_account_id')
    def validate_account_id(cls, v):
        if not re.match(r'^act_\d+$', v):
            raise ValueError('Invalid ad account ID format')
        return v
    
    @validator('report_type')
    def validate_report_type(cls, v):
        allowed_types = ['daily', 'weekly', 'monthly', 'custom']
        if v not in allowed_types:
            raise ValueError(f'Report type must be one of: {allowed_types}')
        return v
```

### SQL Injection Prevention
```python
# Always use parameterized queries
async def get_user_reports(user_id: str, limit: int = 50):
    query = """
        SELECT id, ad_account_id, report_type, created_at 
        FROM reports 
        WHERE created_by = ? 
        ORDER BY created_at DESC 
        LIMIT ?
    """
    return await db.fetch_all(query, [user_id, limit])

# Use ORM when possible
from sqlalchemy import select
from models import Report, User

async def get_user_reports_orm(user_id: str):
    query = select(Report).where(Report.created_by == user_id).order_by(Report.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()
```

---

## 📊 Performance & Monitoring

### Database Optimization
```sql
-- Essential indexes for performance
CREATE INDEX idx_campaigns_account_status ON campaigns(ad_account_id, status);
CREATE INDEX idx_campaign_insights_account_date ON campaign_insights(ad_account_id, date_start, date_stop);
CREATE INDEX idx_reports_account_type_date ON reports(ad_account_id, report_type, created_at);
CREATE INDEX idx_login_sessions_user_created ON login_sessions(user_id, created_at);

-- Composite indexes for complex queries
CREATE INDEX idx_campaign_insights_complex ON campaign_insights(ad_account_id, date_start, campaign_id) 
  WHERE spend > 0;

-- Partial indexes for active records
CREATE INDEX idx_active_campaigns ON campaigns(ad_account_id, name) 
  WHERE status = 'ACTIVE';
```

### Caching Strategy
```python
import redis
import json
from datetime import timedelta

class CacheService:
    def __init__(self, redis_client):
        self.redis = redis_client
        
    async def cache_facebook_data(self, key: str, data: dict, ttl: int = 3600):
        """Cache Facebook API responses for 1 hour"""
        await self.redis.setex(
            f"facebook:{key}", 
            ttl, 
            json.dumps(data, default=str)
        )
    
    async def get_cached_facebook_data(self, key: str):
        """Retrieve cached Facebook data"""
        cached = await self.redis.get(f"facebook:{key}")
        return json.loads(cached) if cached else None
    
    async def cache_report_metrics(self, account_id: str, date_range: str, metrics: dict):
        """Cache calculated metrics for quick access"""
        cache_key = f"metrics:{account_id}:{date_range}"
        await self.redis.setex(cache_key, 7200, json.dumps(metrics, default=str))  # 2 hours
```

### Background Job Processing
```python
from celery import Celery
from celery.schedules import crontab

# Celery configuration
celery_app = Celery(
    'crm_reports',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0'
)

@celery_app.task(bind=True, max_retries=3)
def generate_report_task(self, report_id: str):
    """Background task for report generation"""
    try:
        # Report generation logic
        report = ReportGenerator().generate(report_id)
        return {'status': 'completed', 'report_id': report_id}
        
    except Exception as exc:
        # Exponential backoff retry
        countdown = 2 ** self.request.retries * 60  # 1min, 2min, 4min
        raise self.retry(exc=exc, countdown=countdown)

@celery_app.task
def sync_facebook_accounts_task(business_manager_id: str):
    """Background task for Facebook sync"""
    return FacebookSyncService().sync_accounts(business_manager_id)

# Periodic tasks
celery_app.conf.beat_schedule = {
    'generate-daily-reports': {
        'task': 'tasks.generate_all_daily_reports',
        'schedule': crontab(hour=0, minute=1),  # Every day at 00:01
    },
    'cleanup-old-sessions': {
        'task': 'tasks.cleanup_expired_sessions',
        'schedule': crontab(hour=2, minute=0),  # Every day at 02:00
    },
    'refresh-facebook-tokens': {
        'task': 'tasks.refresh_facebook_tokens',
        'schedule': crontab(hour=3, minute=0),  # Every day at 03:00
    },
}
```

---

## 🧪 Testing Requirements

### Unit Tests
```python
import pytest
from unittest.mock import AsyncMock, patch
from services.auth import AuthenticationService
from services.facebook import FacebookAPIService

class TestAuthenticationService:
    @pytest.fixture
    def auth_service(self):
        return AuthenticationService(
            db_session=AsyncMock(),
            jwt_secret="test_secret",
            geoip_db_path="test.mmdb"
        )
    
    @pytest.mark.asyncio
    async def test_successful_login(self, auth_service):
        # Mock user data
        mock_user = {
            'id': 'user_123',
            'email': 'test@example.com',
            'password_hash': '$2b$12$hashedpassword',
            'role': 'crm_manager',
            'totp_enabled': False
        }
        
        auth_service.db.fetch_one.return_value = mock_user
        
        with patch('bcrypt.checkpw', return_value=True):
            result = await auth_service.authenticate_user(
                email='test@example.com',
                password='correct_password',
                ip_address='192.168.1.100',
                user_agent='Test Browser'
            )
        
        assert result['user']['email'] == 'test@example.com'
        assert 'access_token' in result
        assert 'refresh_token' in result

class TestFacebookAPIService:
    @pytest.fixture
    def facebook_service(self):
        return FacebookAPIService(access_token="test_token")
    
    @pytest.mark.asyncio
    async def test_fetch_ad_accounts(self, facebook_service):
        mock_response = {
            'data': [
                {
                    'id': 'act_123456789',
                    'name': 'Test Account',
                    'account_status': 1,
                    'currency': 'USD'
                }
            ]
        }
        
        with patch.object(facebook_service, 'make_api_call', return_value=mock_response):
            accounts = await facebook_service.fetch_ad_accounts('business_123')
            
            assert len(accounts) == 1
            assert accounts[0]['id'] == 'act_123456789'
```

### Integration Tests
```python
import pytest
from httpx import AsyncClient
from main import app

@pytest.mark.asyncio
async def test_login_endpoint():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "testpassword123"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "access_token" in data

@pytest.mark.asyncio
async def test_generate_report_endpoint():
    # First login to get token
    async with AsyncClient(app=app, base_url="http://test") as client:
        login_response = await client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "testpassword123"
        })
        token = login_response.json()["access_token"]
        
        # Generate report
        report_response = await client.post(
            "/api/reports/generate",
            json={
                "ad_account_id": "act_123456789",
                "date_range": {
                    "start": "2025-06-01",
                    "end": "2025-06-07"
                },
                "report_type": "weekly"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert report_response.status_code == 200
        data = report_response.json()
        assert data["success"] is True
        assert "report_id" in data
```

### Load Testing
```python
import asyncio
import aiohttp
import time

async def load_test_login():
    """Simulate concurrent login attempts"""
    async with aiohttp.ClientSession() as session:
        tasks = []
        for i in range(100):  # 100 concurrent requests
            task = session.post(
                'http://localhost:8000/api/auth/login',
                json={
                    'email': f'user{i}@example.com',
                    'password': 'testpassword123'
                }
            )
            tasks.append(task)
        
        start_time = time.time()
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        end_time = time.time()
        
        successful = sum(1 for r in responses if hasattr(r, 'status') and r.status == 200)
        print(f"Completed {successful}/100 requests in {end_time - start_time:.2f} seconds")

if __name__ == "__main__":
    asyncio.run(load_test_login())
```

---

## 📈 Metrics & Analytics

### Application Metrics
```python
from prometheus_client import Counter, Histogram, Gauge, start_http_server

# Define metrics
LOGIN_ATTEMPTS = Counter('login_attempts_total', 'Total login attempts', ['status'])
REPORT_GENERATION_TIME = Histogram('report_generation_seconds', 'Time spent generating reports')
ACTIVE_SESSIONS = Gauge('active_sessions_total', 'Number of active user sessions')
FACEBOOK_API_CALLS = Counter('facebook_api_calls_total', 'Facebook API calls', ['endpoint', 'status'])

# Usage in code
@app.post("/api/auth/login")
async def login(credentials: LoginCredentials):
    try:
        result = await auth_service.authenticate_user(credentials)
        LOGIN_ATTEMPTS.labels(status='success').inc()
        return result
    except AuthenticationError:
        LOGIN_ATTEMPTS.labels(status='failed').inc()
        raise

@app.post("/api/reports/generate")
async def generate_report(request: ReportRequest):
    with REPORT_GENERATION_TIME.time():
        result = await report_service.generate(request)
    return result
```

### Error Tracking with Sentry
```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

sentry_sdk.init(
    dsn="your_sentry_dsn",
    integrations=[
        FastApiIntegration(auto_enabling_integrations=False),
        SqlalchemyIntegration(),
    ],
    traces_sample_rate=0.1,  # 10% of transactions
    environment="production"
)

# Custom error tracking
def track_facebook_api_error(error: dict, context: dict):
    with sentry_sdk.push_scope() as scope:
        scope.set_tag("service", "facebook_api")
        scope.set_context("facebook_error", error)
        scope.set_context("request_context", context)
        sentry_sdk.capture_exception(Exception(f"Facebook API Error: {error['message']}"))
```

---

## 🔄 Data Backup & Recovery

### Database Backup Strategy
```bash
#!/bin/bash
# Automated backup script

# Variables
DB_NAME="crm_reports"
DB_USER="postgres"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/crm_backup_$DATE.sql"
S3_BUCKET="your-backup-bucket"

# Create backup
pg_dump -h localhost -U $DB_USER -d $DB_NAME -f $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE.gz s3://$S3_BUCKET/database-backups/

# Keep only last 30 days of local backups
find $BACKUP_DIR -name "crm_backup_*.sql.gz" -mtime +30 -delete

# Verify backup integrity
gunzip -t $BACKUP_FILE.gz && echo "Backup integrity verified" || echo "Backup corrupted!"
```

### Data Recovery Procedures
```sql
-- Point-in-time recovery setup
-- 1. Enable WAL archiving in postgresql.conf
archive_mode = on
archive_command = 'cp %p /archive/%f'
wal_level = replica

-- 2. Create base backup
SELECT pg_start_backup('base_backup_label');
-- Copy data directory
SELECT pg_stop_backup();

-- 3. Recovery command for specific timestamp
restore_command = 'cp /archive/%f %p'
recovery_target_time = '2025-06-10 14:30:00'
```

---

## 📋 Deployment Checklist

### Pre-deployment
- [ ] Database schema created with all indexes
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Facebook Business Manager access verified
- [ ] WhatsApp Business API configured
- [ ] Google Sheets service account created
- [ ] AWS S3 bucket and permissions set
- [ ] GeoIP database downloaded
- [ ] Load balancer configured
- [ ] Monitoring tools set up (Prometheus, Grafana, Sentry)
- [ ] Backup procedures tested

### Post-deployment Verification
- [ ] Health check endpoints responding
- [ ] Database connectivity verified
- [ ] Redis caching working
- [ ] Facebook API integration tested
- [ ] WhatsApp message sending tested
- [ ] PDF generation and S3 upload tested
- [ ] Email notifications working
- [ ] HTTPS redirect functioning
- [ ] Rate limiting active
- [ ] Error tracking capturing issues
- [ ] Scheduled tasks running (daily reports, cleanup)

### Security Checklist
- [ ] JWT tokens properly secured
- [ ] API rate limiting configured
- [ ] Input validation on all endpoints
- [ ] SQL injection protection verified
- [ ] CORS policies set correctly
- [ ] IP whitelist functionality tested
- [ ] Two-factor authentication working
- [ ] Password requirements enforced
- [ ] Session management secure
- [ ] File upload restrictions in place

---

## 📞 Support & Maintenance

### Monitoring Alerts
```yaml
# Prometheus alerting rules
groups:
- name: crm_alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 2m
    annotations:
      summary: "High error rate detected"
      
  - alert: DatabaseConnectionFailure
    expr: up{job="postgres"} == 0
    for: 1m
    annotations:
      summary: "Database connection failed"
      
  - alert: FacebookAPIRateLimit
    expr: facebook_api_calls_total{status="rate_limited"} > 10
    for: 5m
    annotations:
      summary: "Facebook API rate limit exceeded"
```

### Common Issues & Solutions

#### 1. Facebook API Token Expiration
```python
# Auto-refresh expired tokens
async def refresh_facebook_token(business_manager_id: str):
    # Exchange short-lived for long-lived token
    url = f"https://graph.facebook.com/v18.0/oauth/access_token"
    params = {
        'grant_type': 'fb_exchange_token',
        'client_id': FACEBOOK_APP_ID,
        'client_secret': FACEBOOK_APP_SECRET,
        'fb_exchange_token': current_token
    }
    
    response = await make_request(url, params)
    new_token = response['access_token']
    
    # Update in database
    await db.execute(
        "UPDATE business_managers SET access_token = ?, token_expires_at = ? WHERE id = ?",
        [new_token, calculate_expiry(response.get('expires_in')), business_manager_id]
    )
```

#### 2. Report Generation Timeout
```python
# Implement timeout and retry mechanism
async def generate_report_with_timeout(report_request):
    try:
        async with asyncio.timeout(1800):  # 30 minutes
            return await report_generator.generate(report_request)
    except asyncio.TimeoutError:
        # Mark as failed and queue for retry
        await mark_report_failed(report_request.id, "Generation timeout")
        await queue_report_retry(report_request.id)
```

#### 3. WhatsApp Delivery Failures
```python
# Retry failed WhatsApp deliveries
async def retry_failed_whatsapp_deliveries():
    failed_deliveries = await db.fetch_all(
        """SELECT * FROM report_deliveries 
           WHERE delivery_method = 'whatsapp' 
           AND delivery_status = 'failed' 
           AND created_at > NOW() - INTERVAL '1 day'"""
    )
    
    for delivery in failed_deliveries:
        try:
            await send_whatsapp_message(delivery)
            await mark_delivery_successful(delivery['id'])
        except Exception as e:
            await log_delivery_error(delivery['id'], str(e))
```

---

This comprehensive specification provides everything needed for a backend developer to implement the complete CRM reporting dashboard system. The specification includes detailed API endpoints, database schemas, security implementations, and deployment guidelines for a production-ready application.

Total estimated development time: **8-12 weeks** for a senior backend developer, depending on team size and Facebook API integration complexity.
