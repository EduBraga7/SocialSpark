import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const template = searchParams.get('template') || 'elegante';
  const title = searchParams.get('title') || 'Nova Coleção Exclusiva';
  const subtitle = searchParams.get('subtitle') || 'Descubra a elegância em cada detalhe.';
  const cta = searchParams.get('cta') || 'Comprar Agora';
  const brandColor = searchParams.get('brandColor') || '#3b82f6';
  const logoUrl = searchParams.get('logoUrl') || '';

  const safeLogoUrl = logoUrl ? `https://wsrv.nl/?url=${encodeURIComponent(logoUrl)}&output=png&w=400&h=400` : '';

  const step = parseInt(searchParams.get('step') || '1', 10);
  const totalSteps = parseInt(searchParams.get('totalSteps') || '3', 10);

  // ─── CARROSSEL ────────────────────────────────────────────────────────────
  if (template === 'carrossel') {
    const isLast = step === totalSteps;
    const isFirst = step === 1;

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
            fontFamily: 'sans-serif',
          }}
        >
          {/* Accent top bar */}
          <div style={{ display: 'flex', width: '100%', height: '10px', backgroundColor: brandColor }} />

          {/* Body */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '60px 72px' }}>

            {/* Header: logo + step badge */}
            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', marginBottom: '64px' }}>
              {/* Logo */}
              {safeLogoUrl ? (
                <img
                  src={safeLogoUrl}
                  width={80}
                  height={80}
                  style={{ borderRadius: '40px', objectFit: 'cover', border: `3px solid ${brandColor}` }}
                />
              ) : (
                <div style={{
                  display: 'flex',
                  width: '80px', height: '80px', borderRadius: '40px',
                  backgroundColor: brandColor,
                  alignItems: 'center', justifyContent: 'center'
                }}>
                  <div style={{ display: 'flex', width: '36px', height: '36px', backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: '18px' }} />
                </div>
              )}


            </div>

            {/* Main content */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
              {/* First slide label */}
              {isFirst && (
                <div style={{
                  display: 'flex',
                  backgroundColor: `${brandColor}18`,
                  color: brandColor,
                  fontSize: 26,
                  fontWeight: 700,
                  padding: '10px 24px',
                  borderRadius: '8px',
                  marginBottom: '32px',
                  alignSelf: 'flex-start',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}>
                  Dica rápida
                </div>
              )}

              <h1 style={{
                fontSize: 80,
                fontWeight: 900,
                color: '#0f172a',
                lineHeight: 1.05,
                marginBottom: '36px',
                textTransform: 'uppercase',
                letterSpacing: '-1px',
              }}>
                {title}
              </h1>

              <p style={{
                fontSize: 40,
                color: '#64748b',
                lineHeight: 1.5,
                fontWeight: 400,
              }}>
                {subtitle}
              </p>
            </div>

            {/* Last slide CTA */}
            {isLast && (
              <div style={{ display: 'flex', marginTop: '48px' }}>
                <div style={{
                  display: 'flex',
                  backgroundColor: brandColor,
                  color: 'white',
                  padding: '28px 64px',
                  borderRadius: '100px',
                  fontSize: 36,
                  fontWeight: 800,
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  {cta}
                  <div style={{ display: 'flex', fontSize: 36 }}>→</div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            padding: '0 72px 40px 72px',
            gap: '16px',
          }}>
            <div style={{ display: 'flex', width: '48px', height: '4px', backgroundColor: brandColor, borderRadius: '2px' }} />
            <div style={{ display: 'flex', flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
          </div>
        </div>
      ),
      { width: 1080, height: 1080 }
    );
  }

  // ─── PROMOCIONAL ──────────────────────────────────────────────────────────
  if (template === 'promocional') {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            backgroundColor: brandColor,
            position: 'relative',
            overflow: 'hidden',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Decorative circles — top right */}
          <div style={{
            display: 'flex',
            position: 'absolute',
            top: '-160px',
            right: '-160px',
            width: '600px',
            height: '600px',
            borderRadius: '300px',
            border: '80px solid rgba(255,255,255,0.08)',
          }} />
          <div style={{
            display: 'flex',
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '400px',
            height: '400px',
            borderRadius: '200px',
            border: '60px solid rgba(255,255,255,0.06)',
          }} />

          {/* Decorative circles — bottom left */}
          <div style={{
            display: 'flex',
            position: 'absolute',
            bottom: '-200px',
            left: '-200px',
            width: '700px',
            height: '700px',
            borderRadius: '350px',
            border: '100px solid rgba(255,255,255,0.06)',
          }} />

          {/* Dot grid pattern top-left */}
          <div style={{
            display: 'flex',
            position: 'absolute',
            top: '60px',
            left: '60px',
            width: '160px',
            height: '160px',
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.25) 2px, transparent 2px)',
            backgroundSize: '24px 24px',
          }} />

          {/* Content */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            padding: '80px',
            position: 'relative',
          }}>
            {/* Logo with glow ring */}
            {safeLogoUrl && (
              <div style={{
                display: 'flex',
                padding: '8px',
                borderRadius: '100px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                marginBottom: '56px',
              }}>
                <img
                  src={safeLogoUrl}
                  width={200}
                  height={200}
                  style={{
                    borderRadius: '100px',
                    objectFit: 'cover',
                    border: '6px solid white',
                  }}
                />
              </div>
            )}

            {/* Title */}
            <div style={{
              fontSize: 96,
              fontWeight: 900,
              color: 'white',
              textAlign: 'center',
              lineHeight: 1.0,
              marginBottom: '32px',
              textTransform: 'uppercase',
              letterSpacing: '-2px',
              textShadow: '0 4px 24px rgba(0,0,0,0.2)',
            }}>
              {title}
            </div>

            {/* Subtitle */}
            <div style={{
              fontSize: 38,
              fontWeight: 400,
              color: 'rgba(255,255,255,0.85)',
              textAlign: 'center',
              lineHeight: 1.4,
              marginBottom: '72px',
              maxWidth: '760px',
            }}>
              {subtitle}
            </div>

            {/* CTA pill button */}
            <div style={{
              display: 'flex',
              backgroundColor: 'white',
              color: brandColor,
              padding: '28px 72px',
              borderRadius: '100px',
              fontSize: 36,
              fontWeight: 800,
              letterSpacing: '-0.5px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            }}>
              {cta}
            </div>
          </div>
        </div>
      ),
      { width: 1080, height: 1080 }
    );
  }

  // ─── ELEGANTE (default) ───────────────────────────────────────────────────
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          backgroundColor: '#ffffff',
          position: 'relative',
          fontFamily: 'sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* ── Left panel (dark) ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '42%',
            height: '100%',
            backgroundColor: '#0f172a',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Geometric triangle top-right */}
          <div style={{
            display: 'flex',
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '240px',
            height: '240px',
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderRadius: '40px',
            transform: 'rotate(45deg)',
          }} />

          {/* Geometric triangle bottom-left */}
          <div style={{
            display: 'flex',
            position: 'absolute',
            bottom: '-80px',
            left: '-80px',
            width: '300px',
            height: '300px',
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderRadius: '60px',
            transform: 'rotate(30deg)',
          }} />

          {/* Dot grid */}
          <div style={{
            display: 'flex',
            position: 'absolute',
            bottom: '80px',
            right: '24px',
            width: '120px',
            height: '120px',
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 2px, transparent 2px)',
            backgroundSize: '20px 20px',
          }} />

          {/* Brand color accent bar */}
          <div style={{
            display: 'flex',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '8px',
            height: '100%',
            backgroundColor: brandColor,
          }} />

          {/* Logo with colored ring */}
          <div style={{
            display: 'flex',
            position: 'relative',
            padding: '10px',
            borderRadius: '100px',
            backgroundColor: `${brandColor}30`,
          }}>
            <div style={{
              display: 'flex',
              position: 'absolute',
              inset: 0,
              borderRadius: '100px',
              border: `4px solid ${brandColor}`,
            }} />
            {safeLogoUrl ? (
              <img
                src={safeLogoUrl}
                width={260}
                height={260}
                style={{
                  borderRadius: '130px',
                  objectFit: 'cover',
                  border: '6px solid rgba(255,255,255,0.15)',
                }}
              />
            ) : (
              <div style={{
                display: 'flex',
                width: '260px',
                height: '260px',
                borderRadius: '130px',
                backgroundColor: brandColor,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{
                  display: 'flex',
                  width: '100px',
                  height: '100px',
                  borderRadius: '50px',
                  backgroundColor: 'rgba(255,255,255,0.3)',
                }} />
              </div>
            )}
          </div>
        </div>

        {/* ── Right panel (white) ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '58%',
            height: '100%',
            padding: '90px 80px',
            justifyContent: 'center',
            backgroundColor: 'white',
            position: 'relative',
          }}
        >
          {/* Small brand color accent top */}
          <div style={{
            display: 'flex',
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            height: '6px',
            backgroundColor: brandColor,
            opacity: 0.15,
          }} />

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Label */}
            <div style={{
              display: 'flex',
              fontSize: 22,
              fontWeight: 700,
              color: brandColor,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              marginBottom: '28px',
            }}>
              Conheça a marca
            </div>

            {/* Title */}
            <h1
              style={{
                fontSize: 76,
                fontWeight: 900,
                color: '#0f172a',
                lineHeight: 1.05,
                marginBottom: '32px',
                letterSpacing: '-1.5px',
              }}
            >
              {title}
            </h1>

            {/* Divider */}
            <div style={{
              display: 'flex',
              width: '64px',
              height: '5px',
              backgroundColor: brandColor,
              borderRadius: '3px',
              marginBottom: '32px',
            }} />

            {/* Subtitle */}
            <p
              style={{
                fontSize: 34,
                color: '#64748b',
                lineHeight: 1.5,
                marginBottom: '72px',
                fontWeight: 400,
              }}
            >
              {subtitle}
            </p>

            {/* CTA pill button */}
            <div
              style={{
                display: 'flex',
                backgroundColor: brandColor,
                color: 'white',
                padding: '24px 52px',
                borderRadius: '100px',
                fontSize: 30,
                fontWeight: 700,
                alignSelf: 'flex-start',
                letterSpacing: '-0.3px',
                gap: '12px',
                alignItems: 'center',
              }}
            >
              {cta}
              <div style={{ display: 'flex', fontSize: 28 }}>→</div>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1080 }
  );
}
