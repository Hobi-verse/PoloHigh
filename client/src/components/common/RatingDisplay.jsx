import fullStar from "../../assets/icons/star.svg";
import halfStar from "../../assets/icons/star-half.svg";
import emptyStar from "../../assets/icons/star-outline.svg";

const clampRating = (rating) => Math.max(0, Math.min(5, rating ?? 0));

const RatingDisplay = ({
  rating = 0,
  count = 0,
  size = "md",
  showCount = true,
  className = "",
}) => {
  const safeRating = clampRating(rating);
  const fullStars = Math.floor(safeRating);
  const hasHalfStar = safeRating - fullStars >= 0.5;
  const totalIcons = 5;

  const iconSize = size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <div
      className={`flex items-center gap-2 text-xs text-emerald-200/80 ${className}`.trim()}
    >
      <div className="flex items-center gap-1">
        {Array.from({ length: totalIcons }).map((_, index) => {
          let icon = emptyStar;
          if (index < fullStars) {
            icon = fullStar;
          } else if (index === fullStars && hasHalfStar) {
            icon = halfStar;
          }

          return (
            <img
              key={index}
              src={icon}
              alt=""
              aria-hidden="true"
              className={iconSize}
            />
          );
        })}
      </div>
      {showCount ? (
        <span className="font-medium text-emerald-100">
          {safeRating.toFixed(1)}
          <span className="ml-1 text-emerald-200/70">
            ({count.toLocaleString()})
          </span>
        </span>
      ) : null}
    </div>
  );
};

export default RatingDisplay;
