import { GetStaticProps } from 'next';

import Link from 'next/link';

import Prismic from '@prismicio/client';
import { FiCalendar, FiUser } from 'react-icons/fi';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';

import Header from '../components/Header';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string | null>(
    postsPagination.next_page
  );

  async function handleLoadNextPage() {
    if (!nextPage) {
      return;
    }

    setIsLoading(true);
    const result = await fetch(nextPage);
    const { next_page, results }: PostPagination = await result.json();

    setNextPage(next_page);
    setPosts([...posts, ...results]);
    setIsLoading(false);
  }

  return (
    <>
      <Header />
      <main className={commonStyles.content}>
        <ul className={styles.postList}>
          {posts.map(({ data, first_publication_date, uid }) => (
            <li key={uid}>
              <Link href={`/post/${uid}`}>
                <a>{data.title}</a>
              </Link>
              <p>{data.subtitle}</p>
              <div className={commonStyles.postInfo}>
                <span>
                  <FiCalendar />
                  {format(new Date(first_publication_date), 'dd MMM yyyy', {
                    locale: ptBR,
                  }).toString()}
                </span>
                <span>
                  <FiUser />
                  {data.author}
                </span>
              </div>
            </li>
          ))}
        </ul>
        {!!nextPage && (
          <button
            type="button"
            className={styles.loadPostButton}
            onClick={handleLoadNextPage}
          >
            {isLoading ? 'Carregando...' : 'Carregar mais posts'}
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.predicates.at('document.type', 'posts'),
    { pageSize: 10, fetch: ['posts.title', 'posts.subtitle', 'posts.author'] }
  );

  return {
    props: {
      postsPagination: postsResponse,
    },
    revalidate: 2 * 60,
  };
};
