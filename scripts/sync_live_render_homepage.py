import urllib.request
import json
import ssl

BASE_URL = 'https://sriyashealthcare-website.onrender.com'
LOGIN_URL = f'{BASE_URL}/api/auth/login'
ADMIN_HOMEPAGE_URL = f'{BASE_URL}/api/admin/homepage'
DRAFT_URL = f'{BASE_URL}/api/admin/homepage/draft'
PUBLISH_URL = f'{BASE_URL}/api/admin/homepage/publish'

ctx = ssl.create_default_context()

def wake_render():
    print(f'[Render Sync] Pinging {BASE_URL}/api/health to ensure server is awake...')
    for attempt in range(5):
        try:
            req = urllib.request.Request(f'{BASE_URL}/api/health', headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, context=ctx, timeout=60) as res:
                print(f'[Render Sync] Server awake! Status: {res.status}')
                return True
        except Exception as e:
            print(f'[Render Sync] Attempt {attempt + 1}/5 waking server: {e}')
            import time
            time.sleep(5)
    return False

def sync_live_homepage():
    if not wake_render():
        print('[Render Sync] Warning: Could not wake render within timeout.')
    print(f'[Render Sync] Authenticating at {LOGIN_URL}...')
    login_data = json.dumps({
        'email': 'admin@sriyashealthcare.com',
        'password': 'Sriyas@2026'
    }).encode('utf-8')
    
    req = urllib.request.Request(
        LOGIN_URL,
        data=login_data,
        headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'}
    )
    
    token = None
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=30) as res:
            res_json = json.loads(res.read().decode('utf-8'))
            token = res_json.get('token')
            print('[Render Sync] Logged in successfully. Token acquired.')
    except Exception as e:
        print('[Render Sync] Login error:', e)
        return False
        
    auth_headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}',
        'User-Agent': 'Mozilla/5.0'
    }
    
    print(f'[Render Sync] Fetching current admin homepage from {ADMIN_HOMEPAGE_URL}...')
    req_get = urllib.request.Request(ADMIN_HOMEPAGE_URL, headers=auth_headers)
    draft_payload = None
    try:
        with urllib.request.urlopen(req_get, context=ctx, timeout=30) as res:
            admin_res = json.loads(res.read().decode('utf-8'))
            homepage_doc = admin_res.get('homepageDoc', {})
            draft_payload = homepage_doc.get('draft') or admin_res.get('draft')
            print('[Render Sync] Current draft acquired. Keys:', list(draft_payload.keys()) if draft_payload else 'None')
    except Exception as e:
        print('[Render Sync] Admin homepage fetch error:', e)
        return False
        
    # Update draft payload
    # 1. Hero
    if 'hero' in draft_payload:
        draft_payload['hero']['ctaText'] = 'Explore Sriyas'
        draft_payload['hero']['ctaLink'] = '#about-sriyas'
        draft_payload['hero']['secondaryCtaText'] = 'View Products'
        draft_payload['hero']['secondaryCtaLink'] = '/products'
        
    # 2. About
    if 'about' in draft_payload:
        draft_payload['about']['images'] = [
            {
                'id': 'about-surgical-liaison',
                'url': 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795106727/sriyas-healthcare/general/file_cwsk2o.jpg',
                'publicId': 'sriyas-healthcare/general/file_cwsk2o',
                'mobileUrl': '',
                'mobilePublicId': '',
                'alt': 'Clinical coordination and surgical device delivery outside operating theatre',
                'caption': 'Operating Room Clinical Liaison & Surgical Device Support',
                'focalPoint': 'center center',
                'aspectRatio': '4/3',
                'size': 'primary',
                'displayOrder': 1
            },
            {
                'id': 'about-hospital-corridor',
                'url': 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795107356/sriyas-healthcare/general/file_vncy1o.jpg',
                'publicId': 'sriyas-healthcare/general/file_vncy1o',
                'mobileUrl': '',
                'mobilePublicId': '',
                'alt': 'Hospital sterile surgical scrub suite coordination',
                'caption': 'Hospital Clinical Presence & Surgical Support',
                'focalPoint': 'center center',
                'aspectRatio': '16/9',
                'size': 'secondary',
                'displayOrder': 2
            }
        ]
        
    # 3. Workplace
    if 'workplace' in draft_payload:
        draft_payload['workplace']['eyebrow'] = 'OUR COMPANY IN ACTION'
        draft_payload['workplace']['heading'] = 'Building Relationships Across the Healthcare Community'
        draft_payload['workplace']['subtitle'] = 'Explore moments from our professional engagements, clinical interactions, manufacturer collaborations and healthcare initiatives.'
        draft_payload['workplace']['layoutStyle'] = 'editorial-carousel'
        draft_payload['workplace']['images'] = [
            {
                "id": "wp-global-delegation",
                "url": "https://res.cloudinary.com/pgjzw0zu/image/upload/v1795106414/sriyas-healthcare/general/file_dmyw9r.jpg",
                "publicId": "sriyas-healthcare/general/file_dmyw9r",
                "mobileUrl": "",
                "mobilePublicId": "",
                "alt": "Sriyas Healthcare leadership and global manufacturer partners delegation",
                "title": "Global Manufacturer Alliances & Corporate Delegation",
                "caption": "Sriyas Healthcare leadership and team alongside international medical technology partners and clinical delegates.",
                "category": "Partnerships",
                "focalPoint": "center center",
                "aspectRatio": "16/9",
                "displayOrder": 1,
                "isActive": True
            },
            {
                "id": "wp-live-surgery-cme",
                "url": "https://res.cloudinary.com/pgjzw0zu/image/upload/v1795107290/sriyas-healthcare/general/file_lbhsyb.jpg",
                "publicId": "sriyas-healthcare/general/file_lbhsyb",
                "mobileUrl": "",
                "mobilePublicId": "",
                "alt": "Live surgical demonstration at FALS Hernia Chennai",
                "title": "Live Surgical Demonstrations & Clinical Workshops",
                "caption": "Supporting faculty demonstrations at prestigious clinical forums including FALS Hernia Chennai, MGM Healthcare, and IAGES.",
                "category": "Surgical Education",
                "focalPoint": "center center",
                "aspectRatio": "16/9",
                "displayOrder": 2,
                "isActive": True
            },
            {
                "id": "wp-medical-expo-booth",
                "url": "https://res.cloudinary.com/pgjzw0zu/image/upload/v1795107307/sriyas-healthcare/general/file_a7kn4f.jpg",
                "publicId": "sriyas-healthcare/general/file_a7kn4f",
                "mobileUrl": "",
                "mobilePublicId": "",
                "alt": "Sriyas Healthcare executive team at healthcare industry exhibition",
                "title": "National Healthcare Expos & Manufacturer Alliances",
                "caption": "Sriyas Healthcare executive team representing partner portfolios (Advanced Medical Solutions, Karl Storz Endoskope) at national medical congresses.",
                "category": "Industry Expos",
                "focalPoint": "center center",
                "aspectRatio": "16/9",
                "displayOrder": 3,
                "isActive": True
            },
            {
                "id": "wp-hernia-symposium",
                "url": "https://res.cloudinary.com/pgjzw0zu/image/upload/v1795107405/sriyas-healthcare/general/file_i8s4ch.jpg",
                "publicId": "sriyas-healthcare/general/file_i8s4ch",
                "mobileUrl": "",
                "mobilePublicId": "",
                "alt": "Surgeon CME presentation on IPOM mesh solutions",
                "title": "Surgeon CME & Hernia Solutions Symposium",
                "caption": "Conducting procedure perspectives and clinical CME sessions on IPOM mesh solutions and tissue reinforcement technologies.",
                "category": "Clinical CME",
                "focalPoint": "center center",
                "aspectRatio": "16/9",
                "displayOrder": 4,
                "isActive": True
            },
            {
                "id": "wp-hospital-presentation",
                "url": "https://res.cloudinary.com/pgjzw0zu/image/upload/v1795107100/sriyas-healthcare/general/file_xpe7i6.jpg",
                "publicId": "sriyas-healthcare/general/file_xpe7i6",
                "mobileUrl": "",
                "mobilePublicId": "",
                "alt": "Clinical training presentation at KMCH Department of General Surgery",
                "title": "Hospital Clinical Presentations & Surgeon Engagement",
                "caption": "Presenting surgical skin adhesives and wound closure solutions to surgical residents and faculty at leading hospitals including KMCH Department of General Surgery.",
                "category": "Hospital Training",
                "focalPoint": "center center",
                "aspectRatio": "16/9",
                "displayOrder": 5,
                "isActive": True
            },
            {
                "id": "wp-surgical-liaison",
                "url": "https://res.cloudinary.com/pgjzw0zu/image/upload/v1795106727/sriyas-healthcare/general/file_cwsk2o.jpg",
                "publicId": "sriyas-healthcare/general/file_cwsk2o",
                "mobileUrl": "",
                "mobilePublicId": "",
                "alt": "Operating room clinical liaison and surgical device delivery",
                "title": "Operating Room Clinical Liaison & Surgical Device Support",
                "caption": "Direct on-site clinical liaison providing emergency surgical stock availability and procedural device support outside the operating suite.",
                "category": "OR Support",
                "focalPoint": "center center",
                "aspectRatio": "16/9",
                "displayOrder": 6,
                "isActive": True
            },
            {
                "id": "wp-hospital-corridor",
                "url": "https://res.cloudinary.com/pgjzw0zu/image/upload/v1795107356/sriyas-healthcare/general/file_vncy1o.jpg",
                "publicId": "sriyas-healthcare/general/file_vncy1o",
                "mobileUrl": "",
                "mobilePublicId": "",
                "alt": "Hospital sterile scrub suite coordination and surgical support",
                "title": "Hospital Clinical Presence & Surgical Support",
                "caption": "Continuous sterile suite coordination and surgical consumable fulfillment across leading specialty hospital surgical departments.",
                "category": "Clinical Support",
                "focalPoint": "center center",
                "aspectRatio": "16/9",
                "displayOrder": 7,
                "isActive": True
            },
            {
                "id": "wp-clinical-training",
                "url": "https://res.cloudinary.com/pgjzw0zu/image/upload/v1795106936/sriyas-healthcare/general/file_zgmlxn.jpg",
                "publicId": "sriyas-healthcare/general/file_zgmlxn",
                "mobileUrl": "",
                "mobilePublicId": "",
                "alt": "Clinical education and surgical solutions training",
                "title": "Clinical Education & Surgical Solutions Training",
                "caption": "Interactive procedural workshops and biosurgical product familiarization for surgical teams, resident faculties, and clinical specialists.",
                "category": "Surgical Training",
                "focalPoint": "center center",
                "aspectRatio": "16/9",
                "displayOrder": 8,
                "isActive": True
            }
        ]

    # 3b. What We Do
    if 'whatWeDo' in draft_payload:
        draft_payload['whatWeDo']['heading'] = 'Focused Capabilities in Surgical & Medical Supply'
        draft_payload['whatWeDo']['subtitle'] = 'Connecting healthcare institutions with specialised surgical products, clinical support and dependable distribution.'
        
    # 4. Leadership
    if 'leadership' in draft_payload:
        draft_payload['leadership']['eyebrow'] = 'LEADERSHIP & GOVERNANCE'
        draft_payload['leadership']['heading'] = 'Principled Leadership Committed to Healthcare Integrity'
        draft_payload['leadership']['subtitle'] = 'Our leadership brings together experience and commitment to building trusted relationships across the healthcare community.'
        if 'items' in draft_payload['leadership']:
            for item in draft_payload['leadership']['items']:
                item['email'] = 'sriyashealthcare@gmail.com'
                
    print(f'[Render Sync] Saving updated draft to {DRAFT_URL}...')
    put_req = urllib.request.Request(
        DRAFT_URL,
        data=json.dumps({'draft': draft_payload}).encode('utf-8'),
        headers=auth_headers,
        method='PUT'
    )
    try:
        with urllib.request.urlopen(put_req, context=ctx, timeout=30) as res:
            print('[Render Sync] Draft saved successfully.')
    except Exception as e:
        print('[Render Sync] Draft save error:', e)
        return False
        
    print(f'[Render Sync] Publishing homepage via {PUBLISH_URL}...')
    pub_req = urllib.request.Request(
        PUBLISH_URL,
        data=json.dumps({}).encode('utf-8'),
        headers=auth_headers,
        method='POST'
    )
    try:
        with urllib.request.urlopen(pub_req, context=ctx, timeout=30) as res:
            pub_res = json.loads(res.read().decode('utf-8'))
            print('[Render Sync] Published successfully! Response:', pub_res.get('message', 'OK'))
            return True
    except Exception as e:
        print('[Render Sync] Publish error:', e)
        return False

if __name__ == '__main__':
    sync_live_homepage()
