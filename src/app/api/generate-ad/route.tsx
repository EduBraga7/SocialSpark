import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const template = searchParams.get('template') || 'elegante';
  const title = searchParams.get('title') || 'Nova Coleção Exclusiva';
  const subtitle = searchParams.get('subtitle') || 'Descubra a elegância em cada detalhe.';
  const cta = searchParams.get('cta') || 'Comprar Agora';
  const brandColor = searchParams.get('brandColor') || '#3b82f6';
  const imageUrl = searchParams.get('imageUrl') || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1080&auto=format&fit=crop';
  const logoUrl = searchParams.get('logoUrl') || '';
  
  const safeImageUrl = `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}&output=jpg`;
  const safeLogoUrl = logoUrl ? `https://wsrv.nl/?url=${encodeURIComponent(logoUrl)}&output=jpg` : '';
  
  const step = searchParams.get('step') || '1';
  const totalSteps = searchParams.get('totalSteps') || '3';

  if (template === 'carrossel') {
    const isLast = step === totalSteps;
    
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            flexDirection: 'column',
            backgroundColor: '#ffffff',
            position: 'relative',
            padding: '80px',
            borderTop: `32px solid ${brandColor}`
          }}
        >
          {/* Top Bar com Logo e Indicador de Passo */}
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', marginBottom: '80px' }}>
            {safeLogoUrl ? (
              <img src={safeLogoUrl} width={100} height={100} style={{ borderRadius: '50px', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100px', height: '100px', borderRadius: '50px', backgroundColor: brandColor }} />
            )}
            <div style={{ display: 'flex', fontSize: 36, fontWeight: 700, color: brandColor, backgroundColor: '#f3f4f6', padding: '16px 32px', borderRadius: '40px' }}>
              {`${step} / ${totalSteps}`}
            </div>
          </div>
          
          {/* Conteúdo Principal */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
            <h1 style={{ fontSize: 72, fontWeight: 900, color: brandColor, lineHeight: 1.2, marginBottom: '40px' }}>
              {title}
            </h1>
            <p style={{ fontSize: 44, color: '#444', lineHeight: 1.5 }}>
              {subtitle}
            </p>
          </div>
          
          {/* CTA no ultimo slide */}
          {isLast && (
             <div style={{ display: 'flex', width: '100%', justifyContent: 'center', marginTop: '40px' }}>
               <div style={{ backgroundColor: brandColor, color: 'white', padding: '32px 64px', borderRadius: '16px', fontSize: 40, fontWeight: 800 }}>
                 {cta}
               </div>
             </div>
          )}
        </div>
      ),
      { width: 1080, height: 1080 }
    );
  }

  if (template === 'promocional') {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            flexDirection: 'column',
            backgroundColor: brandColor,
            color: 'white',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '80px',
          }}
        >
          {safeLogoUrl && (
            <img 
              src={safeLogoUrl} 
              width={240} 
              height={240} 
              style={{ 
                borderRadius: '120px', 
                marginBottom: '60px', 
                border: '6px solid white', 
                objectFit: 'cover' 
              }} 
            />
          )}
          <div style={{ fontSize: 80, fontWeight: 900, marginBottom: 30, textAlign: 'center', lineHeight: 1.1 }}>
            {title.toUpperCase()}
          </div>
          <div style={{ fontSize: 40, fontWeight: 500, marginBottom: 80, opacity: 0.9, textAlign: 'center' }}>
            {subtitle}
          </div>
          <div
            style={{
              display: 'flex',
              backgroundColor: 'white',
              color: brandColor,
              padding: '24px 48px',
              borderRadius: '40px',
              fontSize: 32,
              fontWeight: 800,
            }}
          >
            {cta}
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1080,
      }
    );
  }

  // Template Elegante
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          backgroundColor: '#ffffff',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: '40%',
            height: '100%',
            backgroundColor: brandColor,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {safeLogoUrl && (
            <img 
              src={safeLogoUrl} 
              width={300} 
              height={300} 
              style={{ 
                borderRadius: '150px', 
                objectFit: 'cover', 
                border: '8px solid white',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
              }} 
            />
          )}
        </div>
        
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '60%',
            height: '100%',
            padding: '100px 80px',
            justifyContent: 'center',
            backgroundColor: 'white',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1
              style={{
                fontSize: 72,
                fontWeight: 800,
                color: '#111',
                lineHeight: 1.1,
                marginBottom: 40,
              }}
            >
              {title}
            </h1>
            <p
              style={{
                fontSize: 36,
                color: '#666',
                lineHeight: 1.4,
                marginBottom: 80,
              }}
            >
              {subtitle}
            </p>
            <div
              style={{
                display: 'flex',
                backgroundColor: brandColor,
                color: 'white',
                padding: '24px 48px',
                borderRadius: '8px',
                fontSize: 32,
                fontWeight: 600,
                alignSelf: 'flex-start',
              }}
            >
              {cta}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1080,
    }
  );
}
