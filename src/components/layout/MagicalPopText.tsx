interface MagicalPopTextProps {
  text: string;
}

export function MagicalPopText({ text }: MagicalPopTextProps) {
  const words = text.split(/\s+/);

  return (
    <span aria-label={text}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`} aria-hidden="true">
          <span
            className="home-magical-word"
            style={{ animationDelay: `${(index % 6) * 0.12}s` }}
          >
            {word}
          </span>
          {index < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}
