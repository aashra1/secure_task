const paths = {
  shield: 'M12 3l7 3v5c0 5-3.3 8.5-7 10-3.7-1.5-7-5-7-10V6l7-3z M9.5 12l1.6 1.6 3.7-4',
  lock: 'M7 10V8a5 5 0 0 1 10 0v2 M6 10h12v10H6z M12 14v2',
  mail: 'M4 6h16v12H4z M4 7l8 6 8-6',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0',
  eye: 'M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeOff: 'M3 3l18 18 M10.6 10.6a3 3 0 0 0 3.8 3.8 M9.9 5.4A10 10 0 0 1 12 5c6 0 9.5 7 9.5 7a16.9 16.9 0 0 1-2.7 3.6 M6.6 6.7C3.9 8.4 2.5 12 2.5 12s3.5 7 9.5 7c1.3 0 2.5-.3 3.6-.7',
  plus: 'M12 5v14 M5 12h14',
  check: 'M5 12l4 4 10-10',
  calendar: 'M7 3v4 M17 3v4 M4 8h16 M5 5h14v16H5z',
  flag: 'M5 21V4h11l1 4-1 4H5',
  tag: 'M20 13l-7 7-9-9V4h7l9 9z M8 8h.1',
  edit: 'M4 20h4L19 9l-4-4L4 16v4z M13 7l4 4',
  trash: 'M4 7h16 M10 11v6 M14 11v6 M6 7l1 14h10l1-14 M9 7V4h6v3',
  filter: 'M4 5h16l-6 7v6l-4 2v-8z',
  download: 'M12 3v12 M8 11l4 4 4-4 M5 21h14',
  key: 'M14 10a4 4 0 1 0-3.5 4l-5.5 5.5V22h3v-2h2v-2h2l2.5-2.5A4 4 0 0 0 14 10z M15 9h.1',
  qr: 'M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h2v2h-2z M18 14h2v6h-6v-2h4z M14 18h2v2h-2z',
  spark: 'M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6z',
  users: 'M16 11a4 4 0 1 0-8 0 M3 21a7 7 0 0 1 14 0 M17 14a5 5 0 0 1 4 7',
  list: 'M8 6h13 M8 12h13 M8 18h13 M3 6h.1 M3 12h.1 M3 18h.1',
  logOut: 'M10 17l5-5-5-5 M15 12H3 M21 3v18h-8',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
  x: 'M6 6l12 12 M18 6L6 18',
};

export default function Icon({ name, size = 20, className = '', title }) {
  return (
    <svg
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={`icon ${className}`}
      fill="none"
      height={size}
      role={title ? 'img' : undefined}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={size}
    >
      <path d={paths[name] || paths.spark} />
    </svg>
  );
}
