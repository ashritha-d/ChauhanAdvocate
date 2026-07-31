import LatestUpdates from './LatestUpdates';
import CoursesPreview from './CoursesPreview';

/* Two-column home page split: Live Sessions (left) / Courses (right).
   Collapses to a single stacked column (Live Sessions first) below 768px — see .hsc-grid in index.css. */
export default function HomeSessionsAndCourses() {
  return (
    <section id="latest-updates" className="section-padding bg-light">
      <div className="container-fluid px-3 px-md-4">
        <div className="hsc-grid">
          <div className="hsc-col">
            <LatestUpdates />
          </div>
          <div className="hsc-col">
            <CoursesPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
