// Sala fixa de controle remoto — o display e o controlador (/controle) se conectam
// automaticamente, sem código por acesso. Configurável se houver mais de um totem.
export const CONTROL_ROOM = (process.env.NEXT_PUBLIC_CONTROL_ROOM || 'totem').toUpperCase();
