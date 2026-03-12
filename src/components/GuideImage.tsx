import Image from "next/image";

interface GuideImageProps {
  src: string;
  alt: string;
  caption?: string;
}

export default function GuideImage({ src, alt, caption }: GuideImageProps) {
  return (
    <figure className="my-4">
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <Image
          src={src}
          alt={alt}
          width={800}
          height={450}
          className="w-full h-auto"
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
