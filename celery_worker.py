# from tasks import celery

# if __name__ == "__main__":
#     celery.worker_main(argv=["worker", "--loglevel=info"])


from tasks import celery

if __name__ == "__main__":
    import multiprocessing

    # Start the default Celery worker (Multiprocessing)
    multiprocessing.Process(
        target=celery.worker_main, 
        args=(["worker", "--loglevel=info"],)
    ).start()

    # Start the Sequential Celery worker (One task at a time)
    multiprocessing.Process(
        target=celery.worker_main, 
        args=(["worker", "--loglevel=info", "-Q", "sequential_queue", "--concurrency=1"],)
    ).start()
