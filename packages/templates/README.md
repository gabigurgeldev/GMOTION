# @gmotion/templates

Composições completas prontas — troque texto/mídia e renderize. Combinam presets + transições + efeitos + gráficos + 3D.

## Templates

### `<ViralReel>`
Cortes rápidos, texto grande CapCut, transições agressivas girando (zoom-glitch → shake-cut → whip-pan), grain + vinheta.

```tsx
<ViralReel
  scenes={[
    {text: 'Você sabia?'},
    {text: 'Isso muda tudo', subtext: 'de verdade'},
    {text: 'Segue aí', media: staticFile('bg.jpg')},
  ]}
/>
// duração: viralReelDuration({sceneCount: 3})
```

Props: `sceneFrames` (45), `transitionFrames` (10), `accentColor`, `filmLook`.

### `<Ad15s>`
Anúncio de 15s: hook → produto + preço (contador + "de/por" riscado + barra de escassez) → CTA com badge e shake.

```tsx
<Ad15s
  productName="Fone XYZ Pro"
  price={199.9}
  oldPrice={349.9}
  cta="SÓ HOJE"
  productImage={staticFile('fone.png')}
  brandColor="#6366f1"
/>
// duração: AD_15S_DURATION (450)
```

### `<ChannelIntro>`
Logo 3D extrudado orbitado com partículas + slogan typewriter com glow.

```tsx
<ChannelIntro channelName="GMOTION" slogan="motion em código" material="neon" />
// duração: CHANNEL_INTRO_DURATION (240)
```

## Testes

```sh
pnpm --filter @gmotion/templates test
```
