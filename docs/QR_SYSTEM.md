# 🎫 QR Code Check-in & Scanning System

This document outlines the QR code generation structure, scan lifecycles, and check-in workflows.

---

## 🎫 QR Code Format Structure

To support fast offline ticket scanning and prevent data tampering, the platform generates unique encrypted string tokens for each registered team:

```
[Team Prefix]-[Platform Tag]-[Sequence ID]-[Security Hash]
```

### Example Token
```
AI-AI26-105-SEC4F9B3
```
* **Team Prefix (`AI`)**: Derived from the team's name.
* **Platform Tag (`AI26`)**: Identifies the event (AI Lab Hackathon 2026).
* **Sequence ID (`105`)**: Unique team index ID.
* **Security Hash (`SEC4F9B3`)**: Random string preventing brute-force token generation.

---

## 🔄 Check-in Lifecycle Workflow

```mermaid
sequenceDiagram
    participant P as Participant
    participant V as Volunteer Desk
    participant C as Camera Device (html5-qrcode)
    participant DB as localStorage (siet_teams_v2)

    P->>V: Present QR Code (screen or paper)
    V->>C: Align camera view frame
    C->>V: Extract QR token string
    V->>DB: Query team by QR Token
    alt Token matches, checkedIn is false
        V->>DB: Mark checkedIn = true, update attendance timestamp
        DB-->>V: Success response
        V-->>P: Show Check-in Success toast
    else Token matches, checkedIn is true
        V-->>P: Show "Already Checked-in" alert
    else Token not found
        V-->>P: Show "Invalid QR Code" error
    end
```

---

## 📷 Camera Integration & Scanner Component

The volunteer camera view leverages the **`html5-qrcode`** package to interface with device cameras.
* **Scanning Resolution**: Configured to `640x480` for instant frame processing on mobile devices.
* **Orientation Support**: Detects and switches between front and rear cameras automatically.
* **Fallback UI**: If camera access is denied, volunteers can manually input the QR token string to verify attendance.
